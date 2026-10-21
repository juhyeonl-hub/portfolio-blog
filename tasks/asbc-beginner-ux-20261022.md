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
