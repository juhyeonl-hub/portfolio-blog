# Home favorites
Owner: Codex; Claude read-only allocation completed
Scope: replace frequently-used tools with signed-in selectable shortcuts and signed-out login CTA. Browser-local member-ID storage; no backend/auth mutation.
Base commit: 8f27457 plus preserved timer/maintenance/ad working tree
Done when: auth states, selection, reload, empty state, account isolation, invalid/blocked storage, locales and responsive layouts verified; peer review and deployment.
Design: empty initial selection (user-owned area), six existing home destinations; write only on explicit checkbox action. Native details editor supports Escape. Account-ready hook prevents restoration flash. Member-keyed component remount prevents cross-account state leakage.
Verification: typecheck/lint/full unit suite pass. Browser favorites test passes login/logout, empty defaults, selection/reload/navigation, account isolation, corrupt and blocked storage, four locales/four widths. Existing asbc_home passes. Existing maintenance_banner, ad_layout, screen_localization pass. Timer regression initially referenced removed home CTA; corrected to sidebar tab and passes.
Last verified: 2026-10-21
Last reviewed: Claude read-only review completed status=0/error=null/scope=[]; no functional blockers. Missing sr-only style fixed with picker-scoped rule.
Uncommitted: previous changes preserved; new favorites component/library/test and home/community/CSS/translations edits
Next: none for requested favorites change
Blocker: none

Final: typecheck, lint, all unit scripts, favorites browser, asbc_home, timer_pins, maintenance_banner, ad_layout, screen_localization, diff check and production build pass. Initial test harness issues (Python quoting, duplicate hidden account selector, evaluate function assignment) corrected before final pass.
Deployment: https://fb9b7496.asbc-4c9.pages.dev on main; https://asbc.app HTTP200 and JS/CSS hashes match archived artifact. Favorites browser flow passes on production with mocked auth only; no real account/public writes.
Evidence: D:/CodexData/Projects/ASBC/evidence/favorites-20261021
Artifact: D:/CodexData/Projects/ASBC/artifacts/favorites-20261021/dist-asbc
Limitation: favorites stored per member in current browser, no cross-device synchronization. No new Git commit/push in this follow-up; previous dirty changes preserved.
