// WRD Media booking backend. Runs as the Google account that deploys it (hwrdkan@gmail.com),
// so no OAuth client, key or refresh token is stored anywhere.
// Rules: weekdays 9am-5pm Central, 30-minute slots, 24-hour minimum lead time.
var TZ = 'America/Chicago';
var SLOT_MIN = 30, OPEN_H = 9, CLOSE_H = 17, LEAD_H = 24;

function doGet(e) {
  try {
    if ((e.parameter.action || '') !== 'availability') return out_({ error: 'not found' });
    var days = Math.min(Math.max(parseInt(e.parameter.days || '14', 10) || 14, 1), 21);
    var cal = CalendarApp.getDefaultCalendar();
    var slots = candidates_(days), free = [];
    if (slots.length) {
      var from = slots[0], to = new Date(slots[slots.length - 1].getTime() + SLOT_MIN * 60000);
      var evs = cal.getEvents(from, to);
      slots.forEach(function (s) { if (isFree_(s, evs)) free.push(s.toISOString()); });
    }
    return out_({ slots: free });
  } catch (err) { return out_({ error: 'server' }); }
}

function doPost(e) {
  try {
    var b = JSON.parse(e.postData.contents);
    var start = new Date(b.start);
    var name = String(b.name || '').trim().slice(0, 120), email = String(b.email || '').trim().slice(0, 200);
    if (isNaN(start) || !name || !/^\S+@\S+\.\S+$/.test(email)) return out_({ error: 'invalid' });
    var ok = candidates_(15).some(function (s) { return s.getTime() === start.getTime(); });
    if (!ok) return out_({ error: 'unavailable' });
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      var cal = CalendarApp.getDefaultCalendar();
      var end = new Date(start.getTime() + SLOT_MIN * 60000);
      if (!isFree_(start, cal.getEvents(start, end))) return out_({ error: 'taken' });
      cal.createEvent('WRD Media strategy call: ' + name, start, end, {
        description: 'Phone: ' + String(b.phone || '').slice(0, 40) + '\nEmail: ' + email + '\nNotes: ' + String(b.notes || '').slice(0, 1000),
        guests: email,
        sendInvites: true
      });
    } finally { lock.releaseLock(); }
    return out_({ ok: true });
  } catch (err) { return out_({ error: 'server' }); }
}

function isFree_(s, evs) {
  var a = s.getTime(), b = a + SLOT_MIN * 60000;
  return !evs.some(function (ev) { return a < ev.getEndTime().getTime() && b > ev.getStartTime().getTime(); });
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function ctParts_(d) {
  return {
    y: +Utilities.formatDate(d, TZ, 'yyyy'), m: +Utilities.formatDate(d, TZ, 'M'), d: +Utilities.formatDate(d, TZ, 'd'),
    dow: Utilities.formatDate(d, TZ, 'u') // 1=Mon .. 7=Sun
  };
}
// Central wall-clock -> real Date
function zoned_(y, m, d, hh, mm) {
  var guess = Date.UTC(y, m - 1, d, hh, mm);
  function off(t) {
    var s = Utilities.formatDate(new Date(t), TZ, 'yyyy-M-d-H-m-s').split('-').map(Number);
    return Date.UTC(s[0], s[1] - 1, s[2], s[3], s[4], s[5]) - Math.floor(t / 1000) * 1000;
  }
  var t = guess - off(guess);
  t = guess - off(t);
  return new Date(t);
}
function candidates_(daysAhead) {
  var now = Date.now(), earliest = now + LEAD_H * 3600000, out = [];
  for (var i = 0; i <= daysAhead + 1; i++) {
    var p = ctParts_(new Date(now + i * 86400000));
    if (p.dow === '6' || p.dow === '7') continue;
    for (var mins = OPEN_H * 60; mins + SLOT_MIN <= CLOSE_H * 60; mins += SLOT_MIN) {
      var s = zoned_(p.y, p.m, p.d, Math.floor(mins / 60), mins % 60);
      if (s.getTime() >= earliest && s.getTime() <= now + daysAhead * 86400000) out.push(s);
    }
  }
  return out;
}
