// WRD Media booking proxy. The site talks to this Worker; the Worker forwards to the
// Google Apps Script web app that reads and writes hwrdkan@gmail.com's calendar.
// No secrets. APPS_SCRIPT_URL and ALLOWED_ORIGINS have public defaults, overridable with vars.
const DEFAULTS = {
  // Public by design: the web app only exposes free slots and a booking action.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwMuDocQxK267431-EaT2Ihpcd4ci566dc6rpgWzGNmRFMvn5G-WB9mWqCs5cOCgDXJyg/exec",
  ALLOWED_ORIGINS: "https://wrdmedia.com,https://www.wrdmedia.com,https://wrdmedia-site.pages.dev",
};
const cfg = env => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(env || {}).filter(([k, v]) => v && k in DEFAULTS)) });
const cors = (req, env) => {
  const origin = req.headers.get("Origin") || "";
  const ok = cfg(env).ALLOWED_ORIGINS.split(",").map(s => s.trim()).includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : "null",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
};
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...h } });

export default {
  async fetch(req, env) {
    const h = cors(req, env), url = new URL(req.url), APPS = cfg(env).APPS_SCRIPT_URL;
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (!APPS) return json({ error: "not configured" }, 503, h);
    try {
      if (url.pathname === "/availability" && req.method === "GET") {
        const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "14", 10) || 14, 1), 21);
        const r = await fetch(APPS + "?action=availability&days=" + days, { redirect: "follow" });
        const j = await r.json();
        return json(j, j.error ? 502 : 200, { ...h, "Cache-Control": "no-store" });
      }
      if (url.pathname === "/book" && req.method === "POST") {
        const body = await req.text();
        if (body.length > 4000) return json({ error: "invalid" }, 400, h);
        const r = await fetch(APPS, { method: "POST", headers: { "Content-Type": "text/plain" }, body, redirect: "follow" });
        const j = await r.json();
        const status = j.ok ? 200 : j.error === "taken" ? 409 : j.error === "invalid" || j.error === "unavailable" ? 400 : 502;
        return json(j, status, h);
      }
      return json({ error: "not found" }, 404, h);
    } catch (e) {
      return json({ error: "server" }, 500, h);
    }
  },
};
