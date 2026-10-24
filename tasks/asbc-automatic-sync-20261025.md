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
Next: complete. Suggested follow-up is remembering the connected character across devices; not implemented in this scope.
Blocker: none.

Production round-trip found a stale display when a remote change returned a locally edited setting to its previous value. Fixed the settings subscriber to track local renders as well. Regression verified in independent browser origins: 118 -> 119 on device A, automatically119 on B, B restores118, A automatically118 while retaining focus and build route. Final TypeScript/account-settings regression/build PASS. QA server required a restart because WSL did not invalidate its compiled module cache for D-drive edits; the regression was rerun against the verified new module.

Final production verification (2026-10-25, Europe/Helsinki): source d3320bf165ea23599eb129dda268871fe8d532e7 pushed to main; Pages https://dc6daf6b.asbc-4c9.pages.dev deployed. Canonical HTML and all 5 referenced entry assets byte-match isolated build. Actual Steam Chrome + independent IAB automatic point/timer/map transfer PASS, including returning to an initially displayed value. Point316->317->316 and map0/61->1/61->0/61 update without reload/manual pull, while build/map route and selected location remain. All temporary values restored (crystal316, pins11, movement0/61; existing gather2/2733 preserved). Mobile-width browser433/document416, no horizontal overflow; not physical-phone testing. Screenshots, source hashes, fixture evidence and release checks in D artifact directory. Backend unchanged. No Claude review. Owned QA server stopped and test tabs closed.
