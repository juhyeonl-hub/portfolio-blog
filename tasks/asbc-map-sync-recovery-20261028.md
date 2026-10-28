# Map concurrent/offline recovery — 2026-10-28
Owner: Codex; Claude allocation and final read-only review complete
[Task Goal]: Verify concurrent completion edits and offline/reconnect recovery on same-account two browsers, fix only reproduced defects, then deploy after review.
Scope: account-settings sync/store, map completion UI if needed, focused regression tests. Preserve unrelated pending work and real map progress.
Expected: different concurrent checks union; offline edits remain local then merge with online peer on reconnect; no restored removed check; refresh retains; only test deltas undone.
Base: 00b05d189abd042ea633bf1725c62cafb9dd44b1
Verification: pending. Last reviewed: pending. Next: role coordination then browser/network capability and tests. Blocker: none.

Claude coordination PASS/exit0. Codex sole writer, Claude final review only if fix needed. Preserve user records, per-tab network testing only, no OS network/auth changes. Both normal Steam logins use the same profile and ASBC admin account.

BLOCKER: native Chrome app selection stopped computer use for this turn because current browser URL could not be determined confidently. No app inputs after stop. No offline mode applied; no product changes/deployment. Two simultaneous test checks were issued successfully but union not yet observed: Altgard1110:1052515582:1301199:0 (Chrome1781572547) and :1 (IAB37). Both originally unchecked; initial region total0. Restore these test deltas after control resumes, preserve other records. Details artifacts/map-sync-recovery-20261028/interrupted-state.json.

Resume: browser-only controls recovered through newly owned Chrome1781572560/IAB38. Both old test points survived account login and union observed on both. Issued only own test unchecks. Native offline not attempted yet.
RED: tests/map-sync-recovery.mjs reproduces lost PUT acknowledgement then offline undo + peer edit + reload resurrecting temporary marker. Ordinary concurrent409 and offline/reload/reconnect pass. Fix scope: local persisted per-marker pending intent in AccountSettingsStore; wire schema/server unchanged.

GREEN: focused recovery suite (concurrent409, offline/reload/reconnect+peer edits, lost-ack undo, in-flight undo/ack cleanup, repeated outages) passed. Typecheck, account-settings, trade-sync, world-map, terrain-map, localization passed. Production Chrome desktop + IAB mobile CSS375 simultaneous two-point checks union automatically; mobile reload retained both; both own unchecks issued, final convergence pending. Screenshots in D ASBC artifact folder. Offline network conditions are isolated transport tests so far, not physical-disconnect browser evidence.

Claude final read-only review PASS: process exit0, execution status0/errornull/finished/scope[]. No blocking findings, scoped deployment ready. Addressed F1 by registering recovery test beside account-settings in test:shadowcraft. Added symmetric lost-delete-ack then offline re-check test from already-passing external probe. Reviewed product source hash unchanged. Production own test points fully restored unchecked, region count0, both account-saved.

## Release verification
- Product commit: 9f121a53a769b7fb6530f75774aae5f70c6e0191, pushed main; Pages https://29f2ca0b.asbc-4c9.pages.dev.
- Production Chrome and IAB mobile both loaded asbc-Bmd-q6RZ.js. Simultaneous different-location checks merged to2 automatically; both reloaded and verified the peer marker still checked. Own two test points then unchecked; both region counts0 and account-synced, original states restored. Owned tabs closed, mobile viewport reset.
- Regression suite covers6 cases: concurrent409; offline/reload/reconnect; lost-add-ack then undo; in-flight undo and cleanup; repeated outages; lost-delete-ack then re-check. All PASS. Related account/trade/map/localization/typecheck/build PASS. Test included in test:shadowcraft; full unrelated suite not rerun.
- Physical per-tab network-disconnection UI was not exercised because native browser control could not safely identify its current URL. Fault injection in the actual settings module covered transport failures, lost responses and reload. Do not describe this as physical internet/mobile-device testing.
- Existing314 pending changes preserved; mixed package.json kept its unrelated trade-ledger-summary registration and only inserted our recovery test; mixed PROJECT_BRIEF kept full original body plus own appended notes.
- No further product changes pending; artifacts at D:/CodexData/Projects/ASBC/artifacts/map-sync-recovery-20261028. Review run execution status0/errornull/finished/scope[], source hash retained through deployment. Uncommitted: closeout docs only before this commit. Next: none required for released fix; actual network UI check remains limited as above.
