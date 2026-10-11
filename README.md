# WRD Media site

Static site (index.html, styles.css, script.js) deployed on Cloudflare Pages from `main`. All editable settings are in the `CONFIG` block at the top of `script.js`.

## Turn on the booking calendar

Until `CONFIG.bookingWorkerUrl` is set, the page shows the "Call or text (424) 236-1139" fallback.

1. In Google Cloud, create an OAuth client (Desktop type) with the Calendar API enabled. Use the OAuth Playground (scope `https://www.googleapis.com/auth/calendar`, "Use your own OAuth credentials") to get a refresh token for hwrdkan@gmail.com.
2. From `worker/`: `npx wrangler deploy`, then `npx wrangler secret put GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
3. Put the Worker URL in `CONFIG.bookingWorkerUrl`, commit, push.

Rules in `worker/index.js`: weekdays 9am-5pm CT, 30-min slots, 24h minimum lead time.

## Contact form

Uses FormSubmit. The first submission sends an activation email to HwrdKan@gmail.com (the form inbox; the public address is hk@wrdmedia.com) that must be confirmed once.
