# Ranker switching production audit — 2026-10-27
Owner: Codex UI/implementation; Claude coordination and exact-commit review.
[Task Goal]: GreenOrc ranker switching consistently updates equipment, skills and Daevanion with clear beginner feedback on desktop/mobile, then deploy only scoped fixes.
Scope: ranker-builds.tsx, ranker-boards.tsx, my-ranker-comparison.tsx, ranker-visual.css, lib/ranker-builds.ts, scoped ranker-comparison-text.ts, relevant tests and this task record. No globals/translations/home/trade/backend changes.
Base commit:99898143615946bf86844c1d3a729574fb751488. Reuse clean isolated ranker-visual-20261026 worktree; original primary content and mode noise preserved.
Done when: actual production matrix, evidenced fixes, PC/mobile verification, tests/build, exact-source Claude review and scoped main/push/Pages release.
Inputs/expected: GreenOrc EU Ludra Templar vs Bless/jinjinjin/WANN repeatedly; same selected view/board/guide maintained, new profile only; loading distinct from missing/error; visible current ranker and quick switching while scrolling. Stored data clearly dated, unknown remains unknown. No target apply/save in testing.
Failure cases: previous ranker late response/error, old item modal, false error during loading, guide mode reset, selector obscured by timer/build nav, mobile overflow, accidental plan writes, mixed release.
Verification: production Chrome reproduced guide mode resets to actual after jinjinjin→WANN, loading board tells user to check errors; mobile390 skill-list scroll puts selected ranker at-1657px and picker at-1752px.
Last verified: production before change2026-10-27. Last reviewed: Claude coordination run1793052619517 status0/error null; exact review pending.
Findings: data currently switches correctly in observed sequential requests (Bless416/101,jinjinjin416/86,WANN416/60); UX issues above require bounded corrections.
Uncommitted: new task record only in isolated worktree. Primary baseline hashes captured.
Next: implement clear loading/error, preserve board mode, compact sticky ranker selector with previous/next; cancel superseded requests; UI/regression checks and cross-review.
Blocker: none.

## Implementation and verification
- Sticky ranker selector with previous/next buttons measures existing build navigation and timer height; the current name stays visible during long skill scrolling.
- Controlled actual/guide board mode survives ranker changes; board choice stays selected. Class/roster changes reset mode and board. Superseded profile queries are aborted and latest-request guarded.
- Loading, failed lookup, dated stored snapshots and genuinely missing board data are distinguished. No false zero or guessed allocation.
- A real GreenOrc stale-item failure was reproduced: saved Lakshmi Necklace no longer matched the official equipped identity. Reload my character opens the existing recent-character import, and selecting GreenOrc restored actual Liberator Necklace rolls (Defense47,MP30,Natural MP Regen10). Investment plan and manually entered370 budget remained. Stale ranker items likewise offer full setup reload; transient failures retain retry. English generic error no longer falls back to Korean. Missing info copy does not assert gear definitely changed.
- PC1440x854 and mobile390x844 local UI: Bless→jinjinjin→WANN→jinjinjin→Bless, quick consecutive switches, dropdown direct selection, equipment popup, Escape/focus return and current skill values checked. Bless416/101,jinjinjin416/86,WANN416/60; WANN guide370/0 retained Zikel. Loading shows no previous board.35 skill cards retain game order. Mobile selector stayed at top231.625/bottom315.766 after scrolling2pages; no document horizontal overflow. Mobile dialog width366 fits390 and scrolls internally.
- Local-only API503 middleware (outside source) verified error state with dated snapshot, missing nodes, no stale board; removed flag and Refresh official setup recovered. No backend or production outage simulation.
- Full npm run test:shadowcraft and build:asbc passed before stale-item fix. After that fix: typecheck, focused ranker suite (including stale/transient distinction), and build:asbc passed. Existing large-chunk/plugin timing warnings only. git diff --check passed.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/ranker-switch-20261027/{checks.log,final-checks.log,baseline.json}; screenshots staged under HomeSphere/artifacts/asbc-ranker-switch-20261027 and copied at release.
- Browser testing refreshed observed GreenOrc info; never applied a ranker plan, changed points or saved/published any build.
- A getByLabel exact locator could not resolve a nested-label select in the CUA wrapper; observed DOM select locator succeeded. Not a product failure.
Last verified: local PC/mobile2026-10-27. Exact commit review pending. Next: Claude review, preserve255 primary pending-file hashes, scoped main push and Pages deployment, production UI verification.
