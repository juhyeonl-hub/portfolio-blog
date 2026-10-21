# Beginner UI redesign
Owner: Codex — Claude 불가로 Codex 임시 조율. usage_limit resets 2026-10-26 14:00 Europe/Helsinki; no retry.
Scope: Home purpose cards, guided build preview, one editor per section, plain-language help and responsive controls. Preserve timers, ads, favorites, equipment comparison and data.
Done when: type/lint/domain tests and desktop/mobile navigation, preview/apply/undo verified.
Base commit: 04f27c1
Verification: PASS typecheck:shadowcraft, lint, 32 test:shadowcraft suites, localization (36 screens), build:asbc, git diff --check; browser quick_build.py, build_sections_order.py, ranker_ui.py. Eight classes, preview nonmutation, apply/undo, reload, stable deep links, library export, keyboard help and widths 1366/1440/390/320 verified.
Last verified: 2026-10-22. Final assets: asbc-CbczNtWa.js and asbc-__cJA-Lk.css. Evidence: D:/CodexData/Projects/ASBC/artifacts/beginner-ux-20261022.
Last reviewed: independent cross-review pending (Claude quota).
Findings: quick route displayed all five detailed editors and duplicate recommendation controls; existing QuickBuild was unused.
Uncommitted: this task only; existing untracked context, __pycache__, collaboration records preserved.
Next: user review of implemented UI; no commit, push or deployment performed in this redesign turn.
Blocker: none for implementation. Independent cross-review remains unavailable; no review-pass claim. Existing large-chunk build warning remains.

Visual review: fixed legacy home fixed-grid overlap; reviewed desktop home and 320px mobile help/home screenshots. No backend, auth, game data or storage format changed. Existing local file export/import handlers are exposed together in the library.

Release authorization: user explicitly requested selective commit, remote push and production deployment of this verified UI redesign on 2026-10-22. Proceeding with Codex verification under this instruction; Claude usage_limit persists and independent review is not claimed.

Release completed 2026-10-22: UI feature commit 49fd76e pushed to origin/main. Cloudflare Pages production deployment https://ebffb9f3.asbc-4c9.pages.dev completed; https://asbc.app/ returns 200 and all four initial JS/CSS assets match the verified D-drive release artifact by SHA256.
Production browser verification: quick_build.py, build_sections_order.py and ranker_ui.py PASS against https://asbc.app/. Eight-class preview/apply/undo, saved plan preservation, reload, file export, desktop/mobile320/390, keyboard help, stable deep links and ranker comparison passed. Ranker external-response cases use isolated browser fixtures. No existing user account or saved browser data was modified.
Done: selectively committed, pushed, deployed and operating-origin checks passed. Backend unchanged. Only unrelated untracked JUHYEONL_FULLSTACK_CONTEXT.md, pre-existing __pycache__, and tasks/collaboration/ remain excluded. Earlier pending-release statements are superseded by this release record. Independent Claude review remains unavailable; release uses the explicit user authorization above.
Evidence: D:/CodexData/Projects/ASBC/artifacts/beginner-ux-20261022/release (dist-asbc, sha256.json, production-assets.json, production-ui screenshots).
