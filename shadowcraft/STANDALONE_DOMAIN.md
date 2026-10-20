# Moving ASBC to its own domain

ASBC currently runs at `https://juhyeonl.dev/lab/shadowcraft/` inside the blog's Vercel project (about 49 MB of the 57 MB per deployment). The standalone setup serves the same planner from Cloudflare Pages at the root of its own domain, keeps the existing backend (`api.juhyeonl.dev` through the Cloudflare Tunnel) and moves each visitor's browser data with a one-time transfer.

## What is already in the repository

- `frontend/vite.asbc.config.js`, `frontend/asbc.html`: `npm run build:asbc` builds `frontend/dist-asbc/` with the planner at `/`, static game data under `/shadowcraft/` and Pages `_headers` (OCR files served as gzip, as in `vercel.json`).
- `frontend/asbc-pages/functions/api/[[path]].js`: Pages Function that forwards `/api/*` to the backend, so API calls and the Steam sign-in cookie stay same-origin. `ASBC_API_ORIGIN` overrides the backend (default `https://api.juhyeonl.dev`).
- Data transfer (`frontend/shadowcraft/lib/origin-transfer.ts`, `app/origin-transfer.tsx`): the old page shows "ASBC가 새 주소로 이사했습니다" and opens the new site at `/#transfer`; the new site asks the old window for its planner keys (`shadowcraft-`, `a2bc-`, `asbc-` only), shows a summary and imports on confirmation, keeping any different data already on the new site unless the user chooses to overwrite. Both sides check the exact counterpart origin and a one-time nonce. Old data is never deleted. Disabled until `VITE_ASBC_NEW_ORIGIN` is set.
- Backend: `app.cors.extra-origins` (env `APP_CORS_EXTRA_ORIGINS`) adds the new origin; Steam already uses `app.steam.public-url` and `app.steam.planner-path`.

## Go-live steps

1. **Domain (user):** buy the domain, ideally in Cloudflare Registrar so DNS stays in the existing Cloudflare account.
2. **Pages project (user login once):** `cd frontend/asbc-pages && npx wrangler login`, then create a Pages project (for example `asbc`).
3. **Build and deploy:** `cd frontend && VITE_ASBC_NEW_ORIGIN=https://<domain> npm run build:asbc`, then `cd asbc-pages && npx wrangler pages deploy ../dist-asbc --project-name asbc`. Attach the custom domain in the Pages project.
4. **Backend settings:** add to `~/portfolio-blog-ops/blog.env`:
   `APP_CORS_EXTRA_ORIGINS=https://<domain>`, `APP_STEAM_PUBLIC_URL=https://<domain>`, `APP_STEAM_PLANNER_PATH=/`; restart the backend. Steam sign-in then returns to the new domain; existing Steam links are keyed by SteamID and keep working. Sign-in from the old address stops working at this point, which is why step 5 follows immediately.
5. **Old address:** set `VITE_ASBC_NEW_ORIGIN=https://<domain>` in the blog's Vercel environment and redeploy, so the old planner shows the move banner.
6. **Verify:** planner loads at the new root; community login, Steam sign-in, publish/report work; the transfer moves a test browser's data; `shadowcraft/tests/origin_transfer.py` and the rest of the browser suite pass against the new URL.
7. **Done (2026-10-20):** the blog build no longer ships the planner. `/lab/shadowcraft/` is the light moved page (`lab/shadowcraft/moved.html`, `shadowcraft/moved.tsx`): shared and published links are forwarded to asbc.app with their hash, and browsers with saved planner data get the move banner for the hand-over. The `asbc-moved-page` plugin in `vite.config.js` (build only) renames the page and leaves `public/shadowcraft` out of `dist`, so a blog deployment is about 2 MB. The dev server still serves the full planner at `/lab/shadowcraft/` for the browser tests. Test: `shadowcraft/tests/moved_page.py` after `VITE_ASBC_NEW_ORIGIN=https://asbc.app npm run build`.

## Releasing ASBC

Pushing to main only redeploys the blog (and the moved page). To update asbc.app: `cd frontend && VITE_ASBC_NEW_ORIGIN=https://asbc.app npm run build:asbc`, then `cd asbc-pages && npx wrangler pages deploy ../dist-asbc --project-name asbc --branch main`.

## Local test of the transfer

Run a dev server with two hostnames as two origins:

```bash
cd frontend
VITE_ASBC_OLD_ORIGIN=http://127.0.0.1:5174 VITE_ASBC_NEW_ORIGIN=http://localhost:5174 VITE_ASBC_NEW_PATH=/lab/shadowcraft/ npx vite --port 5174 --host 127.0.0.1
python3 ../shadowcraft/tests/origin_transfer.py
```
