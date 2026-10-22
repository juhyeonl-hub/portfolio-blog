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
