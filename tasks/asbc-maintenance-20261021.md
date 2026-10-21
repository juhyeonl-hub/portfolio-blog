# ASBC official maintenance notices
Owner: Codex, Claude coordination completed
Base commit: 8f27457 + existing timer-pins working tree (preserved)
Scope: read-only official notice API, conservative window parsing, global banner within measured timer header. No backend/auth/storage changes.
Done when: official live notice parsed, future/current/overdue/completed/unknown/failure cases tested, locale/mobile/timer regression pass, peer review and operating site verified.
Input: public notice_en list/details. Output: official planned window and visitor-local ETA, never an inferred live status.
Source verified: https://api-global-community.plaync.com/aion2_global/board/notice_en/article/6ad7900028c7452635072c01 ; official start 2026-10-21T06:30Z, duration5.5h => estimated12:00Z. PDT/CEST are the SAME instant, not different affected regions.
Architecture: browser credentials:omit public reads confirmed from https://asbc.app (HTTP200,CORS). No Pages/backend changes needed. Poll while visible every5min, bounded requests20s; no scheduler/background notification permission.
Verification: typecheck:shadowcraft, lint, test:shadowcraft (30 scripts), build:asbc passed. Browser maintenance_banner (fixture), timer_pins, event_timers, asbc_home, deep_links passed. After review fixes, typecheck/lint/maintenance+localization unit passed again; final browser/build results logged.
Last verified: 2026-10-21 WSL Ubuntu-22.04 Chromium; evidence D:/CodexData/Projects/ASBC/evidence/maintenance-20261021.
Last reviewed: Claude read-only review status=0,error=null,scope=[]; D1 fix required and implemented, D2/D3 noise/failure policy improved. Subsequent fixes runtime-tested by Codex, not peer re-reviewed.
Findings: unknown HTML/time/scope renders notice link only; failed read is not maintenance; completion/cancellation suppressed; expired windows bounded. Prior modifications snapshotted in evidence/maintenance-20261021/before-maintenance-source.zip.
Uncommitted: prior timer-pins changes plus this task
Next: complete; follow-up source changes remain uncommitted.
Blocker: none

## Review dispositions
- D1: malformed candidate fields skipped individually, so valid notices survive; network errors still fail the refresh. Mixed malformed+valid candidate unit case passed.
- D2: no successfully loaded applicable notice means no warning banner on initial API failure; avoids permanent false maintenance noise for blocked clients.
- D3: recent confirmed schedule remains on transient failure with a refresh-failed note. After15minutes it becomes uncertainty rather than an asserted current window.
- D4: actual prior official notice6ace8dc0263e537d356d10c3 is updated in place with (Completed); live parser confirmed completed=true. Separate generic global completion can also suppress older notices; unknown scoped completion is not treated as all-server proof.
- Browser fixture moved into shadowcraft/tests/fixtures/maintenance-notice.json for clean-checkout reproduction; completion/expiry assertions wait for fixture responses to settle.
- Minimal schedule parser deliberately does not guess ambiguous/date-less/unsupported time formats. Regional/named-server/non-game notices show only a recent official link rather than global status. Repeated schedule is never invented.
- Tests' first ETA assertion expected24-hour output; Korean locale correctly uses afternoon03:00 GMT+3 for Helsinki15:00. Test corrected. No application time conversion bug.
- A read-only Node live check initially failed due Windows/bash quoting; stdin script succeeded. Live official output verified start1792564200000/end1792584000000.
- Previous timer-pins/home changes preserved. No backend/Pages/auth/storage/config changes. No stage/commit/push.

## Production result
- Final type/lint, maintenance/localization units, maintenance_banner and timer_pins regressions, final build all passed after review fixes. Whole30-script suite passed before those targeted fixes. Existing >500kB chunk/plugin-time warnings remain.
- Deployed to existing Cloudflare Pages asbc/main: https://a69fdd84.asbc-4c9.pages.dev . Worker compiled/uploaded successfully.
- https://asbc.app/ HTTP200; live JavaScript/CSS hashes match D:/CodexData/Projects/ASBC/artifacts/maintenance-20261021/final/dist-asbc.
- Real production browser (no notice mocks) displayed official10/21 maintenance and Helsinki15:00 GMT+3 expected end (12:00UTC). Screenshot production-live-mobile.png and production-verified.json retained.
- Production fixture regression passed schedule/locale/mobile/anchor/refresh failure/extension/overdue/completed/unknown/expiry cases. These do not prove game server online status; the banner explicitly presents official schedule only.
- Prior timer-pins/home model and tests compared against pre-task zip, unchanged outside the explicit shared UI/translation additions.
- No stage/commit/push, backend changes, auth changes, or scheduled background jobs.
