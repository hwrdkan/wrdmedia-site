/* ===== CONFIG — everything editable lives here ===== */
const CONFIG = {
  businessName: "WRD Media",
  email: "HwrdKan@gmail.com",
  phone: "(424) 236-1139",
  phoneTel: "+14242361139",
  city: "Frisco, TX",
  timezone: "America/Chicago",
  bookingWorkerUrl: "https://wrdmedia-booking.hwrdkan.workers.dev",
  bookingDaysAhead: 14,
  photoFrames: false,            // set true after dropping assets/seq/001.webp..072.webp
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

/* ---------- Pergola line art + scroll-drawn build (signature move) ---------- */
(function pergola() {
  const NS = "http://www.w3.org/2000/svg";
  const main = ["M180 420V170", "M620 420V170", "M340 310V60", "M780 310V60", "M180 170H620", "M340 60H780", "M180 170L340 60", "M620 170L780 60", "M180 420H620", "M620 420L780 310"];
  const rafters = []; for (let x = 235; x < 620; x += 55) rafters.push("M" + x + " 170L" + (x + 160) + " 60");
  const hidden = ["M180 420L340 310", "M340 310H780"];
  const dims = ["M180 468H620", "M180 458V478", "M620 458V478", "M820 60V310", "M810 60H830", "M810 310H830"];
  const mk = (cls, d, draw) => { const p = document.createElementNS(NS, "path"); p.setAttribute("class", cls); p.setAttribute("d", d); if (draw) p.setAttribute("pathLength", "1"); return p; };
  const label = (x, y, t) => { const e = document.createElementNS(NS, "text"); e.setAttribute("x", x); e.setAttribute("y", y); e.textContent = t; return e; };
  const els = [];
  document.querySelectorAll("[data-pergola]").forEach(svg => {
    const draw = svg.dataset.pergola === "draw", g = [];
    hidden.forEach(d => svg.append(mk("p-hidden", d)));
    main.forEach(d => { const p = mk("p-main", d, draw); svg.append(p); g.push(p); });
    rafters.forEach(d => { const p = mk("p-rafter", d, draw); svg.append(p); g.push(p); });
    if (draw) { dims.forEach(d => { const p = mk("p-dim", d, true); svg.append(p); g.push(p); });
      const a = label(400, 462, "16 FT"), b = label(836, 190, "10 FT"); svg.append(a, b); els.push({ svg, g, texts: [a, b], section: svg.closest("section") }); }
  });
  if (!els.length) return;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let queued = false;
  function frame() {
    queued = false;
    els.forEach(o => {
      const r = o.section.getBoundingClientRect(), vh = innerHeight;
      const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      const t = reduce ? 1 : clamp(p / 0.5, 0, 1);
      o.g.forEach((path, i) => { const s = (i / o.g.length) * 0.6; path.style.strokeDashoffset = String(1 - clamp((t - s) / 0.4, 0, 1)); });
      o.texts.forEach(x => { x.style.opacity = t > 0.92 ? 1 : 0; });
      o.svg.style.opacity = o.section.classList.contains("has-frames") ? String(1 - clamp((p - 0.62) / 0.3, 0, 0.82)) : "1";
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", queue, { passive: true }); addEventListener("resize", queue); queue();

  // If the photographic frames exist, let them take over; otherwise the line art stands alone.
  if (CONFIG.photoFrames) {
    const cv = document.querySelector("canvas[data-seq]");
    if (cv) cv.setAttribute("data-sc-sequence", cv.dataset.seq);
    els.forEach(o => o.section.classList.add("has-frames"));
    queue();
  }
})();

/* ---------- Booking ---------- */
(function booking() {
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
        form.querySelector("input[name=name]").focus();
      });
      times.append(b);
    });
    show(times);
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

/* ---------- Scroll engine ---------- */
if (window.ScrollCraft) ScrollCraft.mount(document.body);
