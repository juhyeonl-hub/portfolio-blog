# Build scroll consolidation
Owner: Codex, Claude coordination/review.
Status: COMPLETE.
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
Uncommitted: no task source changes; primary302 pending paths preserved.
Next: none required.
Blocker: none.

Coordination Claude PASS (run1793358139946). Primary purpose recommendation is already authorized by user's explicit earlier request to use leveling/PvE/PvP instead of hunting/survival labels. Preserved the existing safe/damage engine as optional explicit actions; no new approval needed. Codex owns implementation/UI, final readonly review before release.

Implementation: one setup and one skills/specializations editor plus one board editor, normal document scroll. Existing skill category/board selectors retained. Old hashes scroll/focus their section; quick returns to top so character choice remains visible. Optional equipment/macro/boss/compare sections lazy-mount once and preserve visited state. Save/share is a section below the board, with dedicated old library route retained. Purpose recommendation explicit apply+undo. Existing safe/damage recommendation available in collapsed optional actions. No algorithm, persistence or catalog edits.
QA observations: existing node/level edits refresh recommended specializations via unchanged updatePlan behavior; navigation and point budget changes preserve manual choices. Shared over-budget plan reports the actual excess. Incomplete source board counts suppress next connections (reuses characterPoints). No browser console errors. File chooser operation took352s but completed correctly; no user intervention or security changes. Mobile testing is browser viewport simulation, not physical handset.

Claude readonly acceptance: PASS, relay2 finished 2026-10-30T11:36:08.386Z, status0/errornull/scope[]. Reviewed supplied code and evidence; did not independently run browser/tests.

Production: https://4b1da3ca.asbc-4c9.pages.dev, reviewed source 2630d03338bdbd402ebc6a41a97243cfd5ab125b, canonical https://asbc.app serves /assets/asbc-D_5Ms9Oz.js. PC/mobile editing, navigation, apply/undo, save/reload and18 locale/viewport cases passed after deployment. Production isolated alias used UI-generated GreenOrc plan share (character data excluded); canonical page read-only. Local saved full GreenOrc snapshot tested separately; no new character API accuracy claim.
Release: scoped11file source commit;302 pending primary paths/statuses preserved.300 unrelated files byte-identical; PROJECT_BRIEF appended and80 UI fields merged with reverse proof. No catalog, calculation algorithm, authentication, storage or backend changes.
Cleanup: owned normal QA tabs closed, viewport reset, preview stopped, screenshots/helpers adopted into D/ASBC with SHA256 checks. Canonical account and existing Chrome tabs untouched.
Limits: mobile browser viewport simulation, not physical handset. Existing recommendations retained, not a new best-build claim. Reviewer read code and supplied evidence without independently running UI/tests. Documentation-only completion commit does not change deployable assets.

## Daevanion-first follow-up — 2026-10-30
[Task Goal]: Place Daevanion before skills/specializations in the unified build flow per explicit user preference.
Owner: Codex under prior Claude coordination for this same scroll-build task.
Scope: page.tsx section DOM order and anchor ordering only; documentation.
Done when: setup, Daevanion, skills, gear, save order on PC/mobile; legacy URLs reach the same section and saved values remain.
Base commit: 8c34ecdcd6caf093356f44f45751e5975ecbeeee
Failure cases: duplicated/missing section, CSS-only order differs from keyboard order, anchor mismatch, plan reset.
Verification: pending typecheck, navigation, build, local UI, final readonly review, scoped release.
Last reviewed: prior parent-task coordination retained; this follow-up review pending.
Uncommitted: scoped3files; primary302other pending paths preserved.
Next: verify and release under standing scoped deployment authorization.
Blocker: none.

Daevanion-first local verification complete: typecheck/navigation/build and PC/mobile scroll order, anchor focus, node inspection and existing skill preservation PASS. Claude readonly PASS (asbc-daev-first-review-20261030-1793372947512); execution finished/status0/errornull/scope[]. Production verification pending.

Daevanion-first follow-up COMPLETE. Source 165adec7cbe20bad3b4decf948e8af7d38414c44; deployment https://e2c19913.asbc-4c9.pages.dev; canonical asset /assets/asbc-FK5IfJIT.js verified. Setup -> Daevanion -> skills -> optional gear -> save order. Existing handlers, calculations and storage unchanged. Local ko/en x desktop/mobile four cases, navigation/focus/history/node inspection/reload PASS. Canonical existing GreenOrc desktop1200/mobile390 read-only two cases PASS with no overflow or duplicate editors; no new character lookup claim. Mobile is viewport simulation, not physical handset. Primary302pending preserved,301byte-identical and brief append-only proof. Owned tabs closed, viewport reset, preview stopped, evidence adopted with hashes; source helper/staging removal after verification. No remaining feature work.
