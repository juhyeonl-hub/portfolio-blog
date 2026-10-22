# Desktop usability
Owner: Codex — Claude 불가로 Codex 임시 조율; usage_limit until2026-10-26 14:00 Europe/Helsinki, no retry.
Base commit: e02e7fd
Scope: recommendation preview/completion, next actions and direct library navigation.
Findings: live1440x900 preview started below fold; applying removed result while undo remained far above; library missing from main menu.
Done when: keyboard/mouse result visibility, apply/undo, navigation, mobile regression and code checks pass.
Verification: PASS desktop_usability.py (1440x900/1280x720/390x844), quick_build.py (eight classes, preview nonmutation/apply/undo/reload), mobile_usability.py, typecheck:shadowcraft, lint, localization.mjs, navigation.mjs, build:asbc and git diff --check.
Last verified: 2026-10-22; final assets asbc-DRA5SHTe.js / asbc-C-7psnSF.css.
Last reviewed: independent review unavailable, not claimed passed.
Uncommitted: this task only. Existing context, __pycache__, collaboration files preserved.
Next: user review of verified scoped UI changes; no commit/push/deployment performed.
Blocker: none for implementation.
Evidence: D:/CodexData/Projects/ASBC/artifacts/desktop-usability-20261022. Production audit in isolated PC Chromium; no real account data modified.

Implemented: scroll/focus preview into view; applied-result card with game/manual distinction, skill/library actions and existing undo; visible recommendation level/points; main-menu library entry. Final follow-up preserves preview-button focus when cancelling a second preview after application. No recommendation algorithm or storage schema changes. Before/after desktop screenshots visually reviewed. Existing large-chunk warning persists.

Release authorization 2026-10-22: user explicitly requested selective commit, remote push and production deployment of this verified PC improvement. Proceed with Codex verification; Claude usage_limit remains, and independent review is not claimed.
