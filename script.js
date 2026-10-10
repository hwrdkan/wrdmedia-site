/* ===== CONFIG — everything editable lives here ===== */
const CONFIG = {
  businessName: "WRD Media",
  email: "HwrdKan@gmail.com",
  phone: "(424) 236-1139",
  phoneTel: "+14242361139",
  city: "Frisco, TX",
  timezone: "America/Chicago",
  bookingWorkerUrl: "",          // e.g. "https://wrdmedia-booking.<subdomain>.workers.dev" — empty = phone fallback
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
        if (/taken|unavailable/i.test(ex.message)) { err.textContent = "That time was just taken — please go back and pick another."; }
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
        msg.className = "ok"; msg.textContent = "Thanks — I'll reply within one business day."; show(msg);
        btn.textContent = "Sent";
      })
      .catch(() => {
        msg.textContent = "Couldn't send that. Please email " + CONFIG.email + " or call " + CONFIG.phone + ".";
        show(msg); btn.disabled = false; btn.textContent = "Send message";
      });
  });
})();
