// WRD Media booking Worker — Google Calendar availability + booking.
// Secrets (wrangler secret put): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// Vars (wrangler.toml): CALENDAR_ID, ALLOWED_ORIGINS
const TZ = "America/Chicago";
const SLOT_MIN = 30, OPEN_H = 9, CLOSE_H = 17, LEAD_H = 24;

const cors = (req, env) => {
  const origin = req.headers.get("Origin") || "";
  const ok = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : "null",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
};
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...h } });

// Offset (ms) of TZ from UTC at a given instant
function tzOffset(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date).map(x => [x.type, x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}
// Central wall-clock -> UTC Date
function zoned(y, m, d, hh, mm) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffset(new Date(guess));
  t = guess - tzOffset(new Date(t));
  return new Date(t);
}
const ctParts = date => Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).formatToParts(date).map(x => [x.type, x.value]));

async function accessToken(env) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  if (!r.ok) throw new Error("token " + r.status);
  return (await r.json()).access_token;
}

async function busy(env, tok, from, to) {
  const r = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: TZ, items: [{ id: env.CALENDAR_ID }] }),
  });
  if (!r.ok) throw new Error("freebusy " + r.status);
  const j = await r.json();
  return (j.calendars?.[env.CALENDAR_ID]?.busy || []).map(b => [Date.parse(b.start), Date.parse(b.end)]);
}

function candidateSlots(daysAhead) {
  const now = Date.now(), earliest = now + LEAD_H * 3600e3, out = [];
  for (let i = 0; i <= daysAhead + 1; i++) {
    const p = ctParts(new Date(now + i * 86400e3));
    if (p.weekday === "Sat" || p.weekday === "Sun") continue;
    for (let mins = OPEN_H * 60; mins + SLOT_MIN <= CLOSE_H * 60; mins += SLOT_MIN) {
      const s = zoned(+p.year, +p.month, +p.day, Math.floor(mins / 60), mins % 60);
      if (s.getTime() >= earliest && s.getTime() <= now + daysAhead * 86400e3) out.push(s);
    }
  }
  return out;
}
const isFree = (s, busyList) => { const a = s.getTime(), b = a + SLOT_MIN * 60e3; return !busyList.some(([x, y]) => a < y && b > x); };

async function availability(env, days) {
  const slots = candidateSlots(days);
  if (!slots.length) return [];
  const tok = await accessToken(env);
  const b = await busy(env, tok, slots[0], new Date(slots[slots.length - 1].getTime() + SLOT_MIN * 60e3));
  return slots.filter(s => isFree(s, b)).map(s => s.toISOString());
}

async function book(env, body) {
  const start = new Date(body.start);
  const name = String(body.name || "").trim().slice(0, 120), email = String(body.email || "").trim().slice(0, 200);
  if (isNaN(start) || !name || !/^\S+@\S+\.\S+$/.test(email)) return { status: 400, error: "invalid" };
  // Must be one of the real candidate slots (enforces hours + lead time)
  if (!candidateSlots(15).some(s => s.getTime() === start.getTime())) return { status: 400, error: "unavailable" };
  const tok = await accessToken(env);
  const end = new Date(start.getTime() + SLOT_MIN * 60e3);
  if (!isFree(start, await busy(env, tok, start, end))) return { status: 409, error: "taken" };
  const desc = ["Phone: " + String(body.phone || "").slice(0, 40), "Email: " + email, "Notes: " + String(body.notes || "").slice(0, 1000)].join("\n");
  const r = await fetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(env.CALENDAR_ID) + "/events?sendUpdates=all", {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: "WRD Media strategy call — " + name,
      description: desc,
      start: { dateTime: start.toISOString(), timeZone: TZ },
      end: { dateTime: end.toISOString(), timeZone: TZ },
      attendees: [{ email, displayName: name }],
    }),
  });
  if (!r.ok) return { status: 502, error: "calendar" };
  return { status: 200, ok: true };
}

export default {
  async fetch(req, env) {
    const h = cors(req, env), url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    try {
      if (url.pathname === "/availability" && req.method === "GET") {
        const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "14", 10) || 14, 1), 21);
        return json({ slots: await availability(env, days) }, 200, { ...h, "Cache-Control": "no-store" });
      }
      if (url.pathname === "/book" && req.method === "POST") {
        const res = await book(env, await req.json());
        return json(res.ok ? { ok: true } : { error: res.error }, res.status, h);
      }
      return json({ error: "not found" }, 404, h);
    } catch (e) {
      return json({ error: "server" }, 500, h);
    }
  },
};
