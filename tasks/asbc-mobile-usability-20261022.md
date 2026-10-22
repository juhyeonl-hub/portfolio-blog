# Mobile usability follow-up
Owner: Codex — Claude 불가로 Codex 임시 조율; usage_limit until 2026-10-26 14:00 Europe/Helsinki, no retry.
Scope: mobile build selection, reachable main menu, touch-friendly inputs, screenshot instructions and map controls.
Base commit: a8e3a81
Done when: live mobile audit findings reproduced and corrected locally with browser regression coverage.
Findings: on live390px, build pills clipped macro/rotation; main menu scrolled out of view in editors; screenshot/map instructions assumed PC; map filters consumed first view.
Verification: PASS typecheck:shadowcraft, lint, localization, gear-ocr.mjs, terrain-map.mjs, production build, mobile_usability.py, quick_build.py, build_sections_order.py, ranker_ui.py. terrain.py PASS:64 tiles, error/retry, region changes, markers, search, drag/keyboard, mobile and storage nonmutation.
Last verified: 2026-10-22; 390/320px mobile touch Chromium plus desktop. Built asbc-DrSU0jrs.js / asbc-301-LFTO.css.
Last reviewed: independent review unavailable; no pass claimed.
Uncommitted: this task only; existing unrelated untracked files preserved.
Next: hand off verified scoped changes; not committed, pushed or deployed in this turn.
Blocker: none for implementation.
Evidence: D:/CodexData/Projects/ASBC/artifacts/mobile-usability-20261022; production audit used isolated mobile Chromium browser, not physical phone.

Additional finding: ranker comparison incorrectly sent disconnected users back to Build despite supporting connection on the same page. Added an explicit connect-and-compare button using the existing importer. Verified on both mobile widths.
Visual review: before and after mobile screenshots inspected; fixed menu restores focus without scroll jump, all six sections reachable, short-height modal remains closable, file chooser opens, map controls toggle without changing markers. Mobile input controls are at least16px/44px; physical iOS/Android device behavior is not claimed as tested.

Release authorization 2026-10-22: user explicitly requested commit/push/production deployment of this verified mobile improvement only. Codex solo validation is used under this instruction; Claude usage_limit persists and independent review is not claimed.

Release completed 2026-10-22: feature commit5506eed pushed to origin/main; Cloudflare Pages production deployment https://18a12419.asbc-4c9.pages.dev succeeded. https://asbc.app/ returns200 and all four initial JS/CSS assets match the verified build by SHA256 (asbc-DrSU0jrs.js / asbc-301-LFTO.css).
Production verification: mobile_usability.py, quick_build.py, build_sections_order.py and ranker_ui.py PASS at https://asbc.app/. Tests use isolated Chromium contexts; mobile320/390 touch environment, not physical devices. Ranker error/response cases use isolated fixtures. First mobile run found an ambiguous test locator after all map controls loaded; scoped the assertion to the terrain-stage zoom toolbar and reran successfully. Product code unchanged after deployment.
Done: selective commit/push/deployment and operating-origin verification complete. Existing unrelated context, __pycache__ and tasks/collaboration remain excluded. Earlier pending-release statements are superseded. No independent Claude review pass claimed.
Evidence: D:/CodexData/Projects/ASBC/artifacts/mobile-usability-20261022/release contains1890-file artifact, sha256.json, production-assets.json and production-ui screenshots. Mobile-specific after screenshots in the parent directory now reflect the production run.
