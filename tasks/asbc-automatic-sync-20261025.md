# ASBC automatic account settings sync
Owner: Codex. Claude 불가로 Codex 임시 조율: known usage_limit until Oct 26 14:00 Europe/Helsinki, no retry.
Scope: automatic visible-page polling, focus/online refresh, field updates without remount, concurrent edit handling, remove manual load button. Preserve unrelated home changes.
Done when: unit/type/lint/localization/build and actual two-browser PC/mobile-width checks pass; scoped release verified.
Base commit: dc54dc1c812808fb50820ae5668ba22425dd6cf8
Verification: TypeScript PASS; configured JS ESLint PASS (TS checked by tsc); account-settings/plan-memory/world-map/event-timers/localization tests PASS; isolated production build PASS. Independent local browsers: automatic point transfer, concurrent SP150/crystal116 merge, in-flight input focus preservation, unchanged build route/scroll, and automatic recovery after settings API outage PASS. Mobile-width account panel has automatic explanation and no manual load button.
Last verified: 2026-10-25 before implementation. Existing manual cross-browser point/timer/map round trip PASS; all test values restored (crystal316, pins11, movement0/61; gather2/2733 preserved).
Last reviewed: no Claude review; user authorized account-sync release without review.
Findings: old remote apply remounts LocaleProvider and child app, unsuitable for automatic polling.
Uncommitted: existing globals.css/home-panel.tsx/ui-translations deletion preserved; hashes in D artifacts.
Next: publish isolated scope and verify actual Steam browsers; evidence in D:/CodexData/Projects/ASBC/artifacts/automatic-sync-20261025.
Blocker: none.
