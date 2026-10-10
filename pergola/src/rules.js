// Pergola Studio rules engine: sizing, framing, validation and the planning
// price range. Pure functions, no DOM, no 3D, so the math can be tested on its
// own and the same file runs in the browser (window.PergolaRules) and in Node.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PergolaRules = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SIDES = ["front", "back", "left", "right"];

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function snap(v, { min, max, step }) {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    return clamp(Math.round((n - min) / step) * step + min, min, max);
  }

  function ftIn(inches) {
    const ft = Math.floor(inches / 12);
    const rem = Math.round(inches - ft * 12);
    return rem ? `${ft}' ${rem}"` : `${ft}'`;
  }

  // Options offered for this line and, when an option names styles, this style.
  function availableOptions(catalog, line, style) {
    return catalog.options.filter((o) => o.lines.includes(line.id) && (!o.styles || o.styles.includes(style)));
  }

  function lineById(catalog, id) {
    return catalog.lines.find((l) => l.id === id) || catalog.lines[0];
  }

  // Normalise whatever the UI hands us into a valid configuration. Anything
  // the chosen line does not support falls back to that line's first choice,
  // so the 3D view and the price can never disagree about what was chosen.
  function normalize(catalog, input = {}) {
    const eng = catalog.engineering_UNCONFIRMED;
    const line = lineById(catalog, input.line);
    const pick = (value, allowed) => (allowed.includes(value) ? value : allowed[0]);
    const style = pick(input.style, line.styles);
    // Some models only come one way (TEMO's Santa Fe patio cover is attached only).
    const mount = pick(input.mount, (line.styleMounts && line.styleMounts[style]) || line.mounts);
    const allowedOptions = availableOptions(catalog, line, style);
    const options = {};
    for (const o of allowedOptions) {
      const raw = input.options && input.options[o.id];
      if (o.perSide) {
        const sides = Array.isArray(raw) ? raw.filter((s) => SIDES.includes(s)) : [];
        // An attached structure's back side is the house wall.
        options[o.id] = [...new Set(sides)].filter((s) => !(o.rule === "notOnHouseSide" && mount === "attached" && s === "back"));
      } else if (o.perUnit) {
        options[o.id] = clamp(Math.round(Number(raw) || 0), 0, o.max || 4);
      } else {
        options[o.id] = Boolean(raw);
      }
    }
    return {
      line: line.id,
      style,
      mount,
      finish: pick(input.finish, line.finishes),
      widthIn: snap(input.widthIn ?? 144, eng.widthIn),
      depthIn: snap(input.depthIn ?? 144, eng.depthIn),
      louverAngleDeg: line.roof === "louvers-fixed" ? line.fixedLouverAngleDeg : clamp(Number(input.louverAngleDeg ?? 70), 0, 90),
      options,
    };
  }

  // Posts, bays and louvers. Bays split whenever a span would exceed the
  // post span limit or a louver blade would exceed its maximum length.
  function frame(catalog, cfg) {
    const eng = catalog.engineering_UNCONFIRMED;
    const line = lineById(catalog, cfg.line);
    const maxWidthSpan = Math.min(eng.maxPostSpanIn, line.roof.startsWith("louvers") ? eng.maxLouverBladeIn : Infinity);
    const baysW = Math.max(1, Math.ceil(cfg.widthIn / maxWidthSpan));
    const baysD = Math.max(1, Math.ceil(cfg.depthIn / eng.maxPostSpanIn));
    const postRows = cfg.mount === "attached" ? baysD : baysD + 1; // attached: house ledger replaces the back row
    const posts = (baysW + 1) * postRows;
    const louvers = line.roof.startsWith("louvers") ? Math.floor(cfg.depthIn / eng.louverSpacingIn) : 0;
    const areaSqft = (cfg.widthIn * cfg.depthIn) / 144;
    return { baysW, baysD, posts, louvers, areaSqft: Math.round(areaSqft), bayWidthIn: cfg.widthIn / baysW, bayDepthIn: cfg.depthIn / baysD };
  }

  function roundTo(v, step) {
    return Math.round(v / step) * step;
  }

  // Planning range only, never a quote. Dealers override pricing in their
  // own record; the catalog defaults exist so a demo works.
  function price(catalog, cfg, pricing) {
    const p = pricing || catalog.pricing_DEMO_DEFAULTS;
    const line = lineById(catalog, cfg.line);
    const f = frame(catalog, cfg);
    const [rLo, rHi] = p.perSqft[line.priceTier];
    const mult = (p.styleMultiplier[cfg.style] || 1) * (cfg.mount === "freestanding" ? p.freestandingMultiplier : 1);
    let lo = f.areaSqft * rLo * mult;
    let hi = f.areaSqft * rHi * mult;
    const items = [{ label: `${line.name}, ${f.areaSqft} sq ft`, lo: Math.round(lo), hi: Math.round(hi) }];
    let needsPower = false;
    for (const o of availableOptions(catalog, line, cfg.style)) {
      const val = cfg.options[o.id];
      const qty = o.perSide ? val.length : o.perUnit ? val : o.perSqft ? (val ? f.areaSqft : 0) : val ? 1 : 0;
      if (!qty) continue;
      const [oLo, oHi] = p[o.priceKey];
      items.push({ label: qty > 1 && !o.perSqft ? `${o.name} × ${qty}` : o.name, lo: oLo * qty, hi: oHi * qty });
      lo += oLo * qty;
      hi += oHi * qty;
      if (o.needsPower) needsPower = true;
    }
    if (needsPower || line.roof === "louvers-operable") {
      items.push({ label: "Electrical allowance", lo: p.electrical[0], hi: p.electrical[1] });
      lo += p.electrical[0];
      hi += p.electrical[1];
    }
    const low = roundTo(lo, p.roundTo);
    const high = Math.max(low + p.roundTo, roundTo(hi, p.roundTo));
    const monthly = monthlyPayment((low + high) / 2, p.financing.aprPct, p.financing.termMonths);
    return { low, high, monthly, items, frame: f };
  }

  function monthlyPayment(principal, aprPct, months) {
    const r = aprPct / 100 / 12;
    if (!r) return Math.round(principal / months);
    return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
  }

  // Broad "most projects this size" range shown before the lead form.
  function teaser(catalog, cfg, pricing) {
    const p = pricing || catalog.pricing_DEMO_DEFAULTS;
    const q = price(catalog, cfg, p);
    return { low: roundTo(q.low * 0.85, p.roundTo), high: roundTo(q.high * 1.15, p.roundTo) };
  }

  function summary(catalog, cfg) {
    const line = lineById(catalog, cfg.line);
    const style = catalog.styles.find((s) => s.id === cfg.style);
    const fin = catalog.finishes.find((x) => x.id === cfg.finish);
    const f = frame(catalog, cfg);
    const extras = availableOptions(catalog, line, cfg.style)
      .map((o) => {
        const v = cfg.options[o.id];
        if (o.perSide) return v && v.length ? `${o.name} (${v.join(", ")})` : null;
        if (o.perUnit) return v ? `${o.name} × ${v}` : null;
        return v ? o.name : null;
      })
      .filter(Boolean);
    return `${style.name} ${line.name}, ${cfg.mount}, ${ftIn(cfg.widthIn)} × ${ftIn(cfg.depthIn)} (${f.areaSqft} sq ft), ${fin.name}, ${f.posts} posts` + (extras.length ? `. Add-ons: ${extras.join("; ")}.` : ".");
  }

  // Encode a design into a short, URL-safe string so a shared link reopens it.
  function encode(cfg) {
    const json = JSON.stringify(cfg);
    const b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(catalog, str) {
    try {
      const b64 = String(str).replace(/-/g, "+").replace(/_/g, "/");
      const json = typeof atob === "function" ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, "base64").toString("utf8");
      return normalize(catalog, JSON.parse(json));
    } catch {
      return null;
    }
  }

  return { SIDES, snap, ftIn, normalize, frame, price, teaser, summary, monthlyPayment, encode, decode, availableOptions };
});
