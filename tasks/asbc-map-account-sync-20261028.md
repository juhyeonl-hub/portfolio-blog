# Map account sync verification — 2026-10-28
[Task Goal]: Verify automatic map completion sync across two real signed-in browsers and mobile viewport, fix only confirmed defects and deploy if needed.
Owner: coordination requested from Claude; Codex candidate sole writer/UI tester.
Base: 8a00c99c95198d5b2608d9dc31508345dabdd906
Scope: map progress/settings storage and refresh integration, targeted tests, map-only UI guidance if incorrect. Preserve unrelated pending work and every original collection state.
Done when: same account browser A check -> browser B auto receives, B uncheck -> A receives; reload/region navigation/mobile maintain correct records; test-only deltas reverted. Related tests and peer review before deploying fixes.
Failure cases: no auth, key allowlist mismatch, stale mounted view, conflicting region maps, local-only false success, partial merges overwriting unrelated points, session/account leakage.
Uncommitted: task/brief/coordination request only.
Next: verify signed-in browsers, inspect storage and map subscription.

Coordination: Claude assigned Codex sole writer and final Claude read-only review. Execution finished/status0/errornull/scope[]. Real Chrome and IAB signed into the same existing Steam account through normal login. Chrome check -> IAB automatic check passed without reload; mobile reload retained it; mobile uncheck -> Chrome automatic uncheck passed. Both returned to original unchecked state. Investigating missing-base simultaneous first map records with an isolated regression test; production data not used for conflict reproduction.

Confirmed defect: isolated absent-base concurrent map test failed before fix (remote marker missing). Fixed map-only merge to treat absent base as empty, retaining existing per-marker add/remove merge. Added two-store 409/rebase/retry, reverse-uncheck, region-isolation and reload regression. Terrain status now shows account pending/saved/offline next to local save and links to existing sync details using existing translations. Display prefs stay session-local.

Second confirmed live defect: Chrome checked a point and retained checkbox focus; mobile received it, then unchecked. Chrome stayed checked despite visible page and cloud saved status until focus moved away. Existing input guard treated checkbox focus as ongoing text editing. Fixed focus policy to allow completed checkbox/radio/button interactions while retaining text/number/search/textarea/select/contenteditable guards; added semantic guard and automatic poll tests.

Validation: actual Steam same-account normal login in Chrome and independent IAB (admin UI). Chrome check -> IAB automatic receive; mobile390x844 uncheck -> Chrome automatic receive; mobile reload persisted account record. Initially completed 0 for tested Altgard cube1110:1160290092:1301199:0; restored unchecked on both. Focus defect reproduced: Chrome checkbox retained focus and stayed stale after mobile removal; clicking heading unblocked it. Local desktop1280 and mobile390 render without horizontal overflow. Typecheck, account-settings (including two new regressions/focus guard), world-map, terrain-map, localization, trade-sync all exit0. First-region merge regression failed before fix and passes after.

Final review: Claude PASS, no blockers; run asbc-map-account-sync-review-20261028-1793164788189, process exit0; execution finished2026-10-28T05:24:48.680Z/status0/errornull/scope[]. Static review, tests executed by Codex. Reviewed source SHA256 unchanged. Build exit0; main bundle asbc-9-elbC-J.js, CSSasbc-RWGCzSyQ.css. Same-account live focus-retained retest planned immediately after deployment. Only four product/test files plus this task and append-only brief are allowed.
