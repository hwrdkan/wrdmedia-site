/* ===== CONFIG: everything editable lives here ===== */
const CONFIG = {
  businessName: "WRD Media",
  email: "HwrdKan@gmail.com",
  phone: "(424) 236-1139",
  phoneTel: "+14242361139",
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

/* ---------- Logo: big in the hero, shrinks into the header on scroll ---------- */
(function logo() {
  const el = $("#logo"), slot = $("#logo-slot"), bar = $("#bar");
  if (!el || !slot || !bar) return;
  const RATIO = 1291 / 380, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let slotX, slotY0, endX, endY, endScale, dist;
  function measure() {
    const W = Math.min(innerWidth * 0.78, 560);
    el.style.width = W + "px"; slot.style.width = W + "px";
    const r = slot.getBoundingClientRect();
    slotX = r.left; slotY0 = r.top + scrollY;
    const tw = innerWidth < 760 ? 88 : 112;
    endScale = tw / W;
    endX = parseFloat(getComputedStyle($(".wrap")).paddingLeft) || 24;
    endY = (bar.offsetHeight - tw / RATIO) / 2;
    dist = Math.max(1, slotY0 - endY);
    frame();
  }
  function frame() {
    const y = scrollY, p = clamp(y / dist, 0, 1), e = p * p * (3 - 2 * p);
    const s = 1 + (endScale - 1) * e, x = slotX + (endX - slotX) * e, yy = Math.max(slotY0 - y, endY);
    el.style.transform = "translate3d(" + x + "px," + yy + "px,0) scale(" + s + ")";
    el.style.setProperty("--dock", e.toFixed(3));
    bar.classList.toggle("is-scrolled", y > 8);
  }
  let q = false;
  const queue = () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; frame(); }); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", measure);
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  addEventListener("load", measure);
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
  const loops = new Set(["funnel", "glass", "phone", "minichat"]);
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
      if (phone()) { openSheet(box, btn); return; }
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
    fetch(CONFIG.formEndpoint + CONFIG.email, {
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
