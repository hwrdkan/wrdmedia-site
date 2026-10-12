/* ===== CONFIG: everything editable lives here ===== */
const CONFIG = {
  businessName: "WRD Media",
  email: "hk@wrdmedia.com",
  formInbox: "HwrdKan@gmail.com",  // FormSubmit stays on the already-activated inbox
  phone: "(469) 213-0162",
  phoneTel: "+14692130162",
  city: "Frisco, TX",
  timezone: "America/Chicago",
  bookingWorkerUrl: "https://wrdmedia-booking.hwrdkan.workers.dev",
  bookingDaysAhead: 14,
  formEndpoint: "https://formsubmit.co/ajax/",  // + email
};
/* ===================================================== */

const $ = (s, r = document) => r.querySelector(s);
const show = (el, on = true) => { el.hidden = !on; };

// Contact links from config
document.querySelectorAll("[data-phone-link]").forEach(a => { a.href = "tel:" + CONFIG.phoneTel; a.textContent = CONFIG.phone; });
document.querySelectorAll("[data-email-link]").forEach(a => { a.href = "mailto:" + CONFIG.email; a.textContent = CONFIG.email; });

const fmtTime = iso => new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.timezone, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const fmtDay = (iso, opts) => new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.timezone, ...opts }).format(new Date(iso));
const dayKey = iso => new Intl.DateTimeFormat("en-CA", { timeZone: CONFIG.timezone }).format(new Date(iso)); // YYYY-MM-DD

/* ---------- Top bar gets its border once you scroll ---------- */
(function barState() {
  const bar = $("#bar");
  if (!bar) return;
  const set = () => bar.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", set, { passive: true });
  set();
})();

/* ---------- Scroll reveal: fade-in-up and gold rules, nothing else ---------- */
(function reveal() {
  const els = [...document.querySelectorAll(".reveal, .rule")];
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(list => list.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(e => io.observe(e));
})();

/* ---------- Infographics ---------- */
(function infographics() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Buyer filter funnel, built as two layouts so the text stays readable on phones.
  const person = (cls, i, qx, qy, tx, ty, gx, gy) =>
    '<g transform="translate(' + qx + ',' + qy + ')"><g class="pp ghost"><circle cx="0" cy="-10" r="7"/><path d="M-13 14a13 13 0 0 1 26 0z"/></g><g class="pi pi--' + cls + '" style="--i:' + i + ';--gx:' + (gx - qx) + 'px;--gy:' + (gy - qy) + 'px;--fx:' + (tx - qx) + 'px;--fy:' + (ty - qy) + 'px">' +
    '<g class="pp"><circle cx="0" cy="-10" r="7"/><path d="M-13 14a13 13 0 0 1 26 0z"/></g></g></g>';
  function funnel(cfg) {
    let s = '<svg class="' + cfg.cls + '" viewBox="0 0 ' + cfg.w + ' ' + cfg.h + '" focusable="false">';
    s += '<text class="t" x="' + cfg.shopX + '" y="' + cfg.shopY + '" text-anchor="' + cfg.shopA + '">shoppers</text>';
    s += '<text class="t t--gold" x="' + cfg.buyX + '" y="' + cfg.buyY + '" text-anchor="' + cfg.buyA + '">pre-sold buyers</text>';
    s += '<rect class="gate" x="' + (cfg.gx - 54) + '" y="' + (cfg.gy - 60) + '" width="108" height="120" rx="14"/>';
    s += '<path class="cube" d="M' + (cfg.gx - 22) + ' ' + (cfg.gy - 4) + 'h32v32h-32z M' + (cfg.gx - 22) + ' ' + (cfg.gy - 4) + 'l14-14h32l-14 14 M' + (cfg.gx + 24) + ' ' + (cfg.gy - 18) + 'v32l-14 14"/>';
    s += '<text class="t" x="' + cfg.gx + '" y="' + (cfg.gy + 87) + '" text-anchor="middle">sees it in 3D,</text>';
    s += '<text class="t" x="' + cfg.gx + '" y="' + (cfg.gy + 108) + '" text-anchor="middle">agrees to price</text>';
    let b = 0, r = 0;
    cfg.roles.forEach((role, i) => {
      const q = cfg.queue(i);
      if (role === "b") { const f = cfg.buyer(b++); s += person("buyer", i, q[0], q[1], f[0], f[1], cfg.gx, cfg.gy); }
      else { const f = cfg.reject(r++); s += person("reject", i, q[0], q[1], f[0], f[1], cfg.gx, cfg.gy); }
    });
    s += '<text class="t" x="' + cfg.rejX + '" y="' + cfg.rejY + '" text-anchor="middle">filtered out</text></svg>';
    return s;
  }
  const holder = $("[data-funnel]");
  if (holder) {
    holder.innerHTML =
      funnel({ cls: "fun fun-d", w: 900, h: 372, gx: 450, gy: 165, shopX: 60, shopY: 78, shopA: "start", buyX: 650, buyY: 78, buyA: "start",
        roles: "bbbrbbbbrb".split(""), queue: i => [60 + (i % 5) * 46, 130 + Math.floor(i / 5) * 64],
        buyer: k => [650 + (k % 4) * 56, 130 + Math.floor(k / 4) * 64], reject: k => [392 + k * 52, 322], rejX: 418, rejY: 362 }) +
      funnel({ cls: "fun fun-m", w: 360, h: 450, gx: 180, gy: 205, shopX: 180, shopY: 30, shopA: "middle", buyX: 130, buyY: 432, buyA: "middle",
        roles: "bbrbb".split(""), queue: i => [50 + i * 65, 80],
        buyer: k => [40 + k * 60, 385], reject: () => [310, 385], rejX: 310, rejY: 432 });
  }

  // Play when in view. Loops pause off screen; one-shots play once.
  const loops = new Set(["funnel", "glass", "phone", "minichat", "wheel"]);
  const items = [...document.querySelectorAll("[data-info]")];
  if (reduce || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(list => list.forEach(en => {
    const kind = en.target.dataset.info;
    if (en.isIntersecting) { en.target.classList.add("play"); if (!loops.has(kind)) io.unobserve(en.target); }
    else if (loops.has(kind)) en.target.classList.remove("play");
  }), { threshold: 0.3 });
  items.forEach(e => io.observe(e));

  // AI answer flip: replay on click or key
  const flip = $(".flip");
  if (flip) {
    const replay = () => { flip.classList.remove("play"); void flip.offsetWidth; flip.classList.add("play"); };
    flip.addEventListener("click", replay);
    flip.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); replay(); } });
  }

  // Missed-call counter ticks up
  const num = $("[data-count]"), card = num && num.closest("[data-info]");
  if (num && card) {
    const target = +num.dataset.count, prefix = num.dataset.prefix || "";
    num.textContent = prefix + "0";
    let ran = false;
    new IntersectionObserver((l, o) => {
      if (l[0].isIntersecting && !ran) {
        ran = true; o.disconnect();
        const t0 = performance.now(), dur = 1600;
        (function tick(t) {
          const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          num.textContent = prefix + Math.round(target * e).toLocaleString("en-US");
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }
    }, { threshold: 0.4 }).observe(card);
  }
})();

/* ---------- Offer cards: tap to expand on phones ---------- */
(function offers() {
  const mobile = () => matchMedia("(max-width: 759px)").matches;
  document.querySelectorAll(".offer").forEach(card => {
    const btn = card.querySelector(".offer__toggle");
    if (!btn) return;
    const set = open => { card.classList.toggle("is-collapsed", !open); btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", e => { e.stopPropagation(); set(card.classList.contains("is-collapsed")); });
    card.addEventListener("click", e => {
      if (!mobile() || e.target.closest("a, button, input, textarea, .flip")) return;
      set(card.classList.contains("is-collapsed"));
    });
  });
})();

/* ---------- Sticky CTA steps aside when you are already at the booking section ---------- */
(function stickyCta() {
  const bar = $(".sticky-cta"), book = $("#book");
  if (!bar || !book || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(l => bar.classList.toggle("is-hidden", l[0].isIntersecting), { threshold: 0.15 }).observe(book);
})();

/* ---------- Scroll progress line ---------- */
(function progress() {
  const bar = $("#progress");
  if (!bar) return;
  let q = false;
  const draw = () => {
    q = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0).toFixed(4) + ")";
  };
  const queue = () => { if (!q) { q = true; requestAnimationFrame(draw); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  draw();
})();

/* ---------- 3D coverflow: port of the myagencylogics.com Coverflow3D component ---------- */
(function coverflow() {
  document.querySelectorAll("[data-coverflow]").forEach(root => {
    const stage = root.querySelector(".cf3d__stage"), cardsEl = root.querySelector(".cf3d__cards");
    const items = [...root.querySelectorAll("[data-cf-item]")];
    const n = items.length;
    if (!stage || !cardsEl || n < 2) return;
    let active = Math.min(n - 1, Math.max(0, parseInt(root.dataset.start || "0", 10) || 0));
    const rel = i => { const raw = i - active; return raw > n / 2 ? raw - n : raw < -n / 2 ? raw + n : raw; };

    const arrow = (dir, label) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "cf3d__arrow cf3d__arrow--" + (dir < 0 ? "prev" : "next"); b.setAttribute("aria-label", label);
      b.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="' + (dir < 0 ? "M12 15l-5-5 5-5" : "M8 15l5-5-5-5") + '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      b.addEventListener("click", () => go(active + dir));
      return b;
    };
    stage.append(arrow(-1, "Previous service"), arrow(1, "Next service"));
    const dotsEl = document.createElement("div"); dotsEl.className = "cf3d__dots";
    const dots = items.map((it, i) => {
      const d = document.createElement("button"); d.type = "button"; d.className = "cf3d__dot"; d.setAttribute("aria-label", "Show service " + (i + 1));
      d.innerHTML = "<span></span>"; d.addEventListener("click", () => go(i)); dotsEl.append(d); return d;
    });
    root.append(dotsEl);

    function render() {
      items.forEach((el, i) => {
        const o = rel(i), center = o === 0, vis = Math.abs(o) <= 1;
        el.style.transform = center ? "translateX(0%) translateZ(0) rotateY(0deg) scale(1)"
          : o < 0 ? "translateX(-62%) translateZ(-120px) rotateY(38deg) scale(0.78)" : "translateX(62%) translateZ(-120px) rotateY(-38deg) scale(0.78)";
        el.style.opacity = !vis ? 0 : center ? 1 : 0.38;
        el.style.zIndex = center ? 3 : 1;
        el.style.pointerEvents = vis ? "auto" : "none";
        el.dataset.state = center ? "center" : vis ? "side" : "hidden";
        el.setAttribute("aria-hidden", center ? "false" : "true");
        el.querySelectorAll("a,button").forEach(c => { if (center) c.removeAttribute("tabindex"); else c.setAttribute("tabindex", "-1"); });
      });
      dots.forEach((d, i) => d.setAttribute("aria-current", i === active ? "true" : "false"));
    }
    function go(i) { active = (i + n) % n; render(); }

    // swipe / drag (same 40px threshold as the original)
    let sx = null;
    cardsEl.addEventListener("pointerdown", e => { sx = e.clientX; });
    cardsEl.addEventListener("pointerup", e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1)); sx = null; });
    cardsEl.addEventListener("pointercancel", () => { sx = null; });
    // a side card brings itself to the centre instead of acting on what it contains
    cardsEl.addEventListener("click", e => {
      const card = e.target.closest("[data-cf-item]");
      if (card && card.dataset.state !== "center") { e.preventDefault(); e.stopPropagation(); go(items.indexOf(card)); }
    }, true);
    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", e => {
      if (e.target !== root) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    });
    render();
  });
})();

/* ---------- Tool embeds: inline on desktop, full-screen sheet on phones (no scroll trap) ---------- */
(function embed() {
  const phone = () => matchMedia("(max-width: 759px)").matches;
  let sheet = null, opener = null;

  function closeSheet(fromPop) {
    if (!sheet) return;
    sheet.remove(); sheet = null;
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (!fromPop && history.state && history.state.embed) history.back();
    if (opener) { opener.focus(); opener = null; }
  }

  function openSheet(box, btn) {
    opener = btn;
    sheet = document.createElement("div");
    sheet.className = "embed-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", box.dataset.title || "Interactive tool");
    const bar = document.createElement("div");
    bar.className = "embed-sheet__bar";
    const t = document.createElement("span");
    t.textContent = box.dataset.title || "Interactive tool";
    const x = document.createElement("button");
    x.type = "button"; x.className = "embed-sheet__close"; x.textContent = "Close";
    x.addEventListener("click", () => closeSheet(false));
    bar.append(t, x);
    const f = document.createElement("iframe");
    f.src = box.dataset.embed; f.title = box.dataset.title || "Interactive tool";
    f.setAttribute("allow", "fullscreen");
    sheet.append(bar, f);
    document.body.append(sheet);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    history.pushState({ embed: 1 }, "");
    x.focus();
  }

  addEventListener("popstate", () => { if (sheet) closeSheet(true); });
  addEventListener("keydown", e => { if (e.key === "Escape" && sheet) closeSheet(false); });

  document.querySelectorAll("[data-embed]").forEach(box => {
    const btn = box.querySelector(".tryit__launch");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (phone() || box.dataset.sheet === "always") { openSheet(box, btn); return; }
      const f = document.createElement("iframe");
      f.src = box.dataset.embed;
      f.title = box.dataset.title || "Interactive tool";
      f.loading = "eager";
      f.setAttribute("allow", "fullscreen");
      box.replaceChildren(f);
      f.focus();
    });
  });
})();

/* ---------- Scroll moment: "How it works" builds a line as you scroll ---------- */
(function stepsTrack() {
  const ol = $(".steps");
  if (!ol) return;
  const items = [...ol.children];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let q = false;
  function draw() {
    q = false;
    const r = ol.getBoundingClientRect(), vh = innerHeight, mark = vh * 0.62;
    const p = reduce ? 1 : Math.min(1, Math.max(0, (mark - r.top) / r.height));
    ol.style.setProperty("--p", p.toFixed(4));
    items.forEach(li => li.classList.toggle("is-lit", reduce || li.getBoundingClientRect().top + 44 < mark));
  }
  const queue = () => { if (!q) { q = true; requestAnimationFrame(draw); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  draw();
})();

/* ---------- Booking ---------- */
(function booking() {
  if (!$("#b-days")) return;
  const days = $("#b-days"), times = $("#b-times"), form = $("#b-form"),
        done = $("#b-done"), fallback = $("#b-fallback"), err = $("#b-error"),
        chosen = $("#b-chosen"), submit = $("#b-submit");
  let byDay = {}, picked = null;

  function showFallback(msg) {
    [days, times, form, done].forEach(e => show(e, false));
    fallback.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = msg || "Call or text " + CONFIG.phone + " to book.";
    const a = document.createElement("a");
    a.className = "btn"; a.href = "tel:" + CONFIG.phoneTel; a.textContent = "Call or text " + CONFIG.phone;
    fallback.append(p, a);
    show(fallback);
  }

  if (!CONFIG.bookingWorkerUrl) { showFallback(); return; }

  days.textContent = "Loading availability…";
  const base = CONFIG.bookingWorkerUrl.replace(/\/$/, "");
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);

  fetch(base + "/availability?days=" + CONFIG.bookingDaysAhead, { signal: ctl.signal })
    .then(r => { if (!r.ok) throw new Error("avail " + r.status); return r.json(); })
    .then(data => {
      clearTimeout(t);
      (data.slots || []).forEach(s => { (byDay[dayKey(s)] ||= []).push(s); });
      const keys = Object.keys(byDay).sort();
      if (!keys.length) { showFallback("No open times in the next two weeks. Call or text " + CONFIG.phone + " and we'll find one."); return; }
      renderDays(keys);
    })
    .catch(() => showFallback());

  function renderDays(keys) {
    days.textContent = "";
    keys.forEach(k => {
      const first = byDay[k][0];
      const b = document.createElement("button");
      b.type = "button"; b.className = "day";
      b.innerHTML = "<small></small><b></b><small></small>";
      const [wd, mo, dn] = b.querySelectorAll("small, b");
      wd.textContent = fmtDay(first, { weekday: "short" });
      mo.textContent = fmtDay(first, { day: "numeric" });
      dn.textContent = fmtDay(first, { month: "short" });
      b.addEventListener("click", () => {
        days.querySelectorAll(".day").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        renderTimes(k);
      });
      days.append(b);
    });
  }

  function renderTimes(k) {
    times.textContent = "";
    const h = document.createElement("h3");
    h.textContent = fmtDay(byDay[k][0], { weekday: "long", month: "long", day: "numeric" }) + " (Central Time)";
    times.append(h);
    byDay[k].forEach(s => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.textContent = fmtTime(s);
      b.addEventListener("click", () => {
        picked = s;
        chosen.textContent = fmtDay(s, { weekday: "long", month: "long", day: "numeric" }) + " at " + fmtTime(s) + " CT";
        show(days, false); show(times, false); show(form);
        if (matchMedia("(pointer: fine)").matches) form.querySelector("input[name=name]").focus({ preventScroll: true });
        form.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      times.append(b);
    });
    show(times);
    times.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  $("#b-back").addEventListener("click", () => { show(form, false); show(days); show(times); show(err, false); });

  form.addEventListener("submit", e => {
    e.preventDefault();
    show(err, false);
    const f = new FormData(form);
    const name = (f.get("name") || "").trim(), email = (f.get("email") || "").trim();
    if (f.get("company_site")) return; // honeypot
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Please enter your name and a valid email."; show(err); return; }
    submit.disabled = true; submit.textContent = "Booking…";
    fetch(base + "/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: picked, name, email, phone: (f.get("phone") || "").trim(), notes: (f.get("notes") || "").trim() }),
    })
      .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "book " + r.status); return j; })
      .then(() => {
        show(form, false);
        done.innerHTML = "";
        const h = document.createElement("h3"); h.textContent = "You're booked.";
        const p = document.createElement("p"); p.textContent = chosen.textContent + ". A calendar invite is on its way to " + email + ".";
        done.append(h, p); show(done);
      })
      .catch(ex => {
        if (/taken|unavailable/i.test(ex.message)) { err.textContent = "That time was just taken. Please go back and pick another."; }
        else { err.textContent = "Couldn't complete the booking. Call or text " + CONFIG.phone + " and we'll lock it in."; }
        show(err);
        submit.disabled = false; submit.textContent = "Confirm booking";
      });
  });
})();

/* ---------- Contact flow: details, then business, then the calendar ---------- */
(function flow() {
  const root = $("[data-flow]");
  if (!root) return;
  const f1 = $("#f1"), f2 = $("#f2"), f3 = $("#f3"), bf = $("#b-form");
  const slides = [f1, f2, f3], dots = [...root.querySelectorAll(".flow__steps i")];
  const emailOk = v => /^\S+@\S+\.\S+$/.test(v);
  function go(n) {
    slides.forEach((s, i) => show(s, i === n));
    dots.forEach((d, i) => d.classList.toggle("on", i <= n));
    const first = slides[n].querySelector("input:not(.hp), textarea");
    if (first && matchMedia("(pointer: fine)").matches) first.focus({ preventScroll: true });
    root.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  const err = (el, msg) => { el.textContent = msg; show(el, !!msg); };

  f1.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(f1);
    const name = (f.get("name") || "").trim(), phone = (f.get("phone") || "").trim(), email = (f.get("email") || "").trim();
    if (!name || phone.replace(/\D/g, "").length < 7 || !emailOk(email)) {
      err($("#f1-err"), "Please enter your name, a phone number, and a valid email."); return;
    }
    err($("#f1-err"), ""); go(1);
  });
  $("#f2-back").addEventListener("click", () => go(0));

  f2.addEventListener("submit", async e => {
    e.preventDefault();
    const a = new FormData(f1), b = new FormData(f2);
    if (b.get("_honey")) return;
    const name = (a.get("name") || "").trim(), phone = (a.get("phone") || "").trim(), email = (a.get("email") || "").trim();
    const business = (b.get("business") || "").trim(), message = (b.get("message") || "").trim();
    const btn = $("#f2-next"); btn.disabled = true; btn.textContent = "One moment…";
    let sent = true;
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(CONFIG.formEndpoint + CONFIG.formInbox, {
        method: "POST", signal: ctl.signal,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, phone, business, message, _subject: "New WRD Media inquiry from " + name, _honey: "", _captcha: "false" }),
      });
      clearTimeout(t); if (!r.ok) sent = false;
    } catch (x) { sent = false; }
    // carry the details into the booking form so nothing is typed twice
    bf.name.value = name; bf.email.value = email; bf.phone.value = phone;
    bf.notes.value = [business && "Business: " + business, message].filter(Boolean).join("\n");
    bf.classList.add("is-prefilled");
    $("#b-who").textContent = name + " \u00b7 " + email;
    const first = name.split(/\s+/)[0];
    $("#f3-note").textContent = sent
      ? "Thanks, " + first + ". Your details are in and we'll reply within one business day. Pick a time to lock in your call."
      : "Thanks, " + first + ". We couldn't send your details automatically, so please email " + CONFIG.email + " too. Pick a time below to lock in your call.";
    btn.disabled = false; btn.textContent = "Next: pick a time";
    go(2);
  });

  $("#b-edit").addEventListener("click", () => go(0));
})();

/* ---------- Contact form ---------- */
(function contact() {
  if (!$("#c-form")) return;
  const form = $("#c-form"), msg = $("#c-msg"), btn = $("#c-submit");
  form.addEventListener("submit", e => {
    e.preventDefault();
    msg.className = "error"; show(msg, false);
    const f = new FormData(form);
    if (f.get("_honey")) return;
    const name = (f.get("name") || "").trim(), email = (f.get("email") || "").trim(),
          business = (f.get("business") || "").trim(), message = (f.get("message") || "").trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !business || !message) {
      msg.textContent = "Please fill in your name, a valid email, your business and a message."; show(msg); return;
    }
    btn.disabled = true; btn.textContent = "Sending…";
    fetch(CONFIG.formEndpoint + CONFIG.formInbox, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name, email, phone: (f.get("phone") || "").trim(), business, message,
        _subject: "New WRD Media inquiry from " + name, _honey: "", _captcha: "false",
      }),
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(() => {
        form.reset();
        msg.className = "ok"; msg.textContent = "Thanks. I'll reply within one business day."; show(msg);
        btn.textContent = "Sent";
      })
      .catch(() => {
        msg.textContent = "Couldn't send that. Please email " + CONFIG.email + " or call " + CONFIG.phone + ".";
        show(msg); btn.disabled = false; btn.textContent = "Send message";
      });
  });
})();

/* ---------- Mobile menu: hamburger with collapsible sections ---------- */
(function mobileMenu() {
  const bar = document.querySelector("header.bar, header.pagebar");
  if (!bar) return;
  const MENU = [
    { t: "Home", href: "/" },
    { t: "Services", items: [
      ["Ascend: Google and AI visibility", "/services/ai-answer-visibility/"],
      ["Envision: 3D sales tools", "/services/3d-sales-tools/"],
      ["Architect: marketing director", "/services/marketing-director/"],
      ["AI receptionist", "/services/ai-phone-assistants/"],
      ["All services and pricing", "/services/"]
    ] },
    { t: "Industries", items: [
      ["Pergolas and outdoor living", "/pergola-contractor-marketing/"],
      ["Turf and rubber surfacing", "/turf-contractor-marketing/"],
      ["Roofing", "/roofing-contractor-marketing/"],
      ["Fencing", "/fencing-contractor-marketing/"],
      ["Decks and outdoor kitchens", "/deck-outdoor-kitchen-contractor-marketing/"],
      ["Pools and spas", "/pool-spa-contractor-marketing/"],
      ["Concrete and epoxy", "/concrete-epoxy-contractor-marketing/"]
    ] },
    { t: "Areas we serve", items: [
      ["Frisco, TX", "/frisco-tx/"], ["McKinney, TX", "/mckinney-tx/"], ["Prosper, TX", "/prosper-tx/"],
      ["Plano, TX", "/plano-tx/"], ["Allen, TX", "/allen-tx/"], ["Dallas-Fort Worth", "/dallas-fort-worth/"]
    ] },
    { t: "Try the tools", items: [
      ["3D pergola designer", "/pergola/"],
      ["Turf photo visualizer", "https://turf.wrdmedia.com/"]
    ] },
    { t: "Guides", href: "/guides/" },
    { t: "About", href: "/about/" },
    { t: "Contact", href: "/#contact" }
  ];
  const path = location.pathname.replace(/\/index\.html$/, "/");
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const cur = h => (h === path ? ' aria-current="page"' : "");
  let html = "";
  MENU.forEach(m => {
    if (m.href) { html += '<a class="mnav__link" href="' + m.href + '"' + cur(m.href) + ">" + esc(m.t) + "</a>"; return; }
    const open = m.items.some(i => i[1] === path);
    html += '<details class="mnav__sec" name="mnav"' + (open ? " open" : "") + "><summary>" + esc(m.t) + '</summary><div class="mnav__sub">' +
      m.items.map(i => '<a href="' + i[1] + '"' + cur(i[1]) + ">" + esc(i[0]) + "</a>").join("") + "</div></details>";
  });
  html += '<a class="btn btn--block mnav__cta" href="/#book">Book a Call</a>';

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "burger";
  btn.setAttribute("aria-label", "Open menu");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "mnav");
  btn.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
  bar.appendChild(btn);

  const panel = document.createElement("nav");
  panel.id = "mnav";
  panel.className = "mnav";
  panel.setAttribute("aria-label", "Menu");
  panel.hidden = true;
  panel.innerHTML = html;
  bar.insertAdjacentElement("afterend", panel);

  const mq = matchMedia("(min-width:760px)");
  function setOpen(o) {
    if (o && mq.matches) return;
    panel.style.setProperty("--bar-h", bar.getBoundingClientRect().height + "px");
    panel.hidden = !o;
    btn.setAttribute("aria-expanded", String(o));
    btn.setAttribute("aria-label", o ? "Close menu" : "Open menu");
    document.documentElement.classList.toggle("mnav-open", o);
  }
  btn.addEventListener("click", () => setOpen(panel.hidden));
  panel.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) { setOpen(false); btn.focus(); } });
  document.addEventListener("click", e => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false); });
  mq.addEventListener("change", () => setOpen(false));
})();
