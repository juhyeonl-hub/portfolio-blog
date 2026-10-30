# Build scroll consolidation
Owner: Codex, Claude coordination/review.
Status: VERIFIED FOR RELEASE.
[Task Goal]: Replace confusing build subpage tabs and duplicate skill/daevanion presentations with one scrollable plan.
Scope: Workshop composition/navigation, unified setup presentation, scoped layout/copy translations, relevant UI/regression tests. Preserve recommendation algorithms, game data, saved plans/account sync, and unrelated primary changes.
Done when: one visible skill editor and one daevanion editor; level/point setup visible once; existing section links reach sections; manual edits/reload/save work on PC/mobile; reviewed scoped release under standing authorization.
Base commit: 9787df87777c2e261962346abf03dad6062151a6
Inputs/outputs: GreenOrc existing snapshot, no fresh character lookup claim. Edit same plan through skills and board; no implicit recommendation application on navigation. Old /build/skills and /build/daevanion URLs scroll to correct sections. Preserve sharing/library/ranker flows.
Failure cases: duplicate controls/IDs, hidden edits after anchor jumps, hash back/forward reset, expensive eager fetches, narrow-language overflow, preview mistaken for saved plan, existing user data overwritten.
Verification: existing45script suite, focused specializations, new lazy disclosure state test, typecheck,8-language localization, production build and SEO PASS.
Last verified: GreenOrc saved snapshot, PC1440/mobile390 editing, point input no implicit apply, apply/undo, save/reload/share/apply, six legacy URLs/back-forward, lazy compare, assassin boss section;18 locale/width cases.
Last reviewed: Claude final readonly review PASS.
Findings: QuickBuild, PointBudgetPanel, plan editor and context each repeat settings/recommendations.
Uncommitted: scoped work only; primary 302 pending paths preserved.
Next: scoped release and production verification.
Blocker: none.

Coordination Claude PASS (run1793358139946). Primary purpose recommendation is already authorized by user's explicit earlier request to use leveling/PvE/PvP instead of hunting/survival labels. Preserved the existing safe/damage engine as optional explicit actions; no new approval needed. Codex owns implementation/UI, final readonly review before release.

Implementation: one setup and one skills/specializations editor plus one board editor, normal document scroll. Existing skill category/board selectors retained. Old hashes scroll/focus their section; quick returns to top so character choice remains visible. Optional equipment/macro/boss/compare sections lazy-mount once and preserve visited state. Save/share is a section below the board, with dedicated old library route retained. Purpose recommendation explicit apply+undo. Existing safe/damage recommendation available in collapsed optional actions. No algorithm, persistence or catalog edits.
QA observations: existing node/level edits refresh recommended specializations via unchanged updatePlan behavior; navigation and point budget changes preserve manual choices. Shared over-budget plan reports the actual excess. Incomplete source board counts suppress next connections (reuses characterPoints). No browser console errors. File chooser operation took352s but completed correctly; no user intervention or security changes. Mobile testing is browser viewport simulation, not physical handset.

Claude readonly acceptance: PASS, relay2 finished 2026-10-30T11:36:08.386Z, status0/errornull/scope[]. Reviewed supplied code and evidence; did not independently run browser/tests.
