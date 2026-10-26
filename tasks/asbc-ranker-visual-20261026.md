# Ranker visual comparison — 2026-10-26
Owner: Codex implementation/visual checks, Claude coordination and review.
[Task Goal]: Make ranker equipment, skills and Daevanion immediately understandable on PC/mobile, preserving unrelated work.
Scope: ranker comparison components, scoped CSS/text and observation tests. Separate English beginner example and introduction draft; Search Console read-only metrics check.
Done when: equipment opens visible accessible paired dialog; grouped game-order skill icons compare actual final levels; raw ranker boards and budget guide are explicitly separate; no automatic plan writes; PC/mobile verified; exact-commit review before release.
Base commit: 9c3160734a5e12e7a72226f9b2860e8dbdcc1b24
Inputs/expected: GreenOrc vs Bless; click either neck item opens same-slot two-sided options inside viewport; missing skill stays unknown, never0; final levels do not infer invested points/specs; selected raw nodes green, budget mode retains priority/later colors; Escape returns focus; changing ranker never retains previous profile.
Failure cases: clipped dialog, hidden close button, stale profiles/options, inaccurate zero/missing data, mixed raw/priority semantics, overflow, unwanted apply/save, unrelated diff.
Verification: production bug reproduced optionsTop1022 in854pxviewport. Implementation pending.
Last verified: 2026-10-26 production before change.
Last reviewed: Claude coordination completed; precise raw-board plan pending; exact-source review pending.
Findings: CSS forces options below tall gear grid; skill list collapsed/plain; boards hidden behind preview.
Uncommitted: isolated worktree;231primary pending paths recorded, not copied.
Next: implement, targeted tests and PC/mobile, cross-review, authorized scoped release.
Blocker: none. Search Console metrics still processing; not zero traffic.

## Implementation and verification
Claude precise-plan approval: tasks/collaboration/runs/asbc-ranker-visual-plan-20261026-1793035533370 (primary). Six required conditions adopted.
Changed: paired native dialog with abort-on-unmount and focus return; visible equipment/skills/Daevanion tabs; observed final-level cards in catalog order; raw actual board mode separate from budget guide; explicit preview retains canApply budget/level guard and confirmation; mobile board enlargement. Four-language scoped copy, no central translations/globals edits.
Checks: complete test:shadowcraft suite and build:asbc passed; final TypeScript, ranker observations/budgets/order/missing/zero/equipped, eight-class target paths and localization passed; final build passed. Existing chunk-size warning remains.
UI: real CUA actions on local app proxying official production lookup at CSS1440x854 and390x844. GreenOrc EU Ludra Lv45, observed253 ordinary points. Bless416/101, jinjinjin416/86. Equipment popup options visible in viewport; Escape/backdrop close restore clicked item; unmount cancels request. Skill first: Bless15 vs GreenOrc14; jinjinjin20 after switching. Actual-board green nodes separated from guide colors. Budget316→370 updates suggestion316→370 and keeps full apply disabled without101Azphel. Mobile zoom expands nodes20.87→51.28px inside horizontal scroller; page has no overflow. English tooltip reference explicitly says actual spec choices unknown. No production planner writes from this verification.
Evidence: D:/CodexData/Projects/ASBC/artifacts/ranker-visual-20261026/{checks.log,final-checks.log,ui-verification.json,*.png}.
English introduction and verified beginner comparison walkthrough drafts prepared in same artifact folder; no external posting. A configured beginner published build still needs authored base investments/spec choices; observed final levels are not sufficient and are not reverse-inferred.
Search Console performance: processing notice, no impression/click metrics yet.
Status: implementation verified; exact-commit Claude cross-review pending. Standing user authorization permits scoped UI release after passing review.
