# Five-language ranking, timers and ledger — 2026-10-29
Status: IMPLEMENTED; final read-only review and deployment pending. Owner Codex. Base95372aef4a0a9786cea51bc7631b2a9f8596d7fb.
[Task Goal]: Verify fr/de/es/pt-BR/ru ranking/comparison, timers and trade ledger on PC1440x1000/mobile viewport360x800; fix reproduced issues and deploy reviewed scope. Prior immediate deployment authorization retained. Preserve primary302 pending paths and original accounts/GreenOrc/plans/books.
Claude allocation relay1/max4 PASS; Codex implementation/browser QA, Claude final read-only review. No auth/backend/game math changes.

Reproduced and fixed:
- Ranking list/picker/current profile combat-power integers ignored UI locale. Three calls now use locale.
- Timer observation title included Korean afternoon/date in all5 chosen languages. Date formatting now uses locale (timezone/schedule logic unchanged).
- Ranker skill specialization provenance: fr/es/pt-BR claimed the ranker's choices; de/ru omitted site proposals. All5 now explicitly my choices / site suggestions; no unverified ranker specialization presented as known.
- Ten exact dictionary fields: five signed-out ledger storage notices remove stray item-name text/use trade ledger wording; fr/de/es quantity is units instead of entries; RU pin wording and a missing sentence space.
- Mobile Spanish actual screen: static wrapped build navigation was counted in sticky ranker-switcher offset (151.59px). Switcher y320..422 covered gear/skills tabs y376..423, so gear click hit the selector. Only pinned navigation now contributes height; ResizeObserver and cleaned-up resize listener handle resizing. Local360 test from scrolled Daevanion to gear changes aria-pressed to true; selector now y168..271 and all3 tabs visible. No CSS file change.

Checks after final source: ranker-builds, ranking-availability, event-timers, boss-timers, trade-calculator, trade-workbench, localization, specialization-localization; typecheck:shadowcraft, build:asbc, test:asbc-seo — all11 exit0. Build warnings: preexisting bundle size/plugin timing; no errors.

Actual browser baseline:
- 10 ledger cases all5x2 widths on same-source isolated production deployment origin, signed out. Buy100x130000; sell25 actual net3375000 =>profit125000,75remaining/cost9750000. Additional buy25x140000 =>profit stays125000,100remaining/cost13250000. Oversale101 blocked; reload retains3entries. Own QA item delete/undo/delete restores empty books. Original account ledger untouched.
- 10 timer cases all5x2: EU/Ludra/Europe-Helsinki, server validation, search Gartua, unpin/pinned filter/re-pin, Events category with3 timers, reload retention, no horizontal overflow. Korean date in observation tooltip reproduced. Fixtures on isolated production version only.
- Canonical asbc.app read-only GreenOrc comparison: Bless/WANN switching and actual Daevanion worked; FR skill provenance error reproduced. Valid full comparison viewport cases FR1440/360,DE1440/360,ES1440; ES360 exposed sticky obstruction above. Earlier mismatched viewport snapshots are excluded as passes. All5x2 comparison verification still pending after fix/deploy.
- Local build actual360 screenshot confirms mobile tab obstruction fixed. Local public profile proxy cannot read production response; do not count actual node/proposal loading locally. No fabricated/mocked API data or security changes. Live actual nodes/provenance will be rechecked on canonical production.

Evidence: D:/CodexData/Projects/ASBC/artifacts/five-language-rank-timer-ledger-20261029; screenshots/DOM/results/check logs. No physical handset claim. Chrome extension interruption means mutations completed in IAB, not claimed as Chrome passes. Original Chrome tabs untouched.
Release scope exactly4 source files + this task + append-only PROJECT_BRIEF. Shared dictionary overlap must semantic-merge only10fields; brief append preserved. Remaining: Claude review, scoped commit/main push/Pages deploy, new-source all5 PC/mobile QA, originals restored and evidence adopted/hashed.

Read-only review: first attempt timed out without output (not a pass); one permitted retry relay3/max4 PASS, finished 2026-10-29T13:48:12.147Z. Process exit0/status0/errornull/scope[]. All5x2 local viewport cases now pass gear/skills/Daevanion-tab navigation and localized integers; all5x2 local ledger notice/unit/profit125000/remaining75 cases pass. Actual live node/proposal verification remains canonical postdeploy. Only four reviewed source files and two task documents are released.
