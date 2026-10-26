# Shared build to personal planner audit — 2026-10-26
Owner: Codex. Claude 불가로 Codex 임시 조율: recorded usage_limit until Oct26 14:00 Helsinki; no retry.
[Task Goal]: Verify production shared build apply, personal editing, named save and reopening on PC/mobile; fix demonstrated issues and deploy only scoped fixes.
Scope: shared-build apply handoff, planner navigation/edit/save UX, scoped recovery and tests. Preserve all existing pending work; no gameplay recommendation changes, auth policy or unrelated features.
Done when: PC1440/mobile390 apply/edit/save/reopen verified; original GreenOrc planner restored; evidenced fixes tested and released if needed.
Inputs/expected: published test post f1337ebe; Fierce Strike base8/final10 and selected Capture node apply exactly; personal edits persist without modifying the source post.
Failure cases: wrong route/class, overwritten personal data without recovery, shared guidance disappearing without notice, budget change, save failure, mobile overflow, stale auto recommendation replacing authored allocation.
Base commit: d5abae93c623cac654f5d47cc3e88d4a08d4c2f6
Verification: PASS — local and deployed PC1440/mobile390 apply/edit/named save/reload/reapply; original personal plan restored exactly.
Last reviewed: self-review complete; no Claude cross-review claimed. User authorized immediate scoped fix/deploy.
Findings: false edited-warning, unstable apply URL and missing saved-plan preview fixed; save navigation made visible on mobile.
Uncommitted: all 227 preexisting pending paths preserved; mixed files checked by removing this task's changes.
Next: none for this task. Other pending work is outside scope.
Blocker: none for verification.
Original plan: saved via UI as [검증 전 원본] 수호성 2026-10-26 and exported to artifacts/shared-planner-audit-20261026/planner-before.json. Do not overwrite this evidence.

## Production findings
- PC applied public test post: base8/final10, SP195, Daevanion142. Edited base7, named save and reload/restore retained7. Mobile390 repeated apply, edited base6, save/reload/restore retained6. Document375/client375.
- False edited-warning appears immediately after account synchronization because plan comparison depends on object property order. Shared apply leaves URL at# even though editor is open.
- Saved-build preview displays character query comparisons but no actual plan allocations; unlinked shared plans produce unhelpful missing-query messages. Mobile save action is far below skill rows.
- Original GreenOrc plan restored through UI backup; exported plan deep-equals initial JSON. Three clearly labelled local-only snapshots retained (original, PC, mobile). Source public post unchanged.
- Fix scope: stable plan equality, stable shared editor URL, direct save navigation, actual skill/node preview and edit navigation from saved build. No storage schema, account synchronization policy or game rules change.

## Implemented and locally verified
- Stable shared application URL #/build/skills; actual plan comparison ignores JSON object-key order but detects edits. No storage schema or sync policy change.
- Named-copy action visible above editors on PC/mobile; library shows actual skill/specialization/Daevanion allocation and point usage. Apply leads directly to skill editing. Character-query comparison remains collapsible only when both characters exist.
- Shared page explains that authored equipment guidance remains in original post and personal edits do not modify it. Actual gear bonus is used in saved preview. Four manually translated keys (en/ja/fi).
- Isolated TypeScript; plan-memory, build-library, build-share, public-builds, navigation, account-settings, localization suites PASS. PC1440/mobile390 edit/save/reload/reapply PASS; base7 and base6 exact, selected Capture node visible, no console errors or horizontal overflow.
- Mobile CSS specificity conflict discovered and fixed. D-drive Vite watcher retained old CSS; restarting owned local server verified final CSS.
- Source integrated by scoped patch; preexisting page footer and dictionary additions retained.

## Release decision
User explicitly requested fixes and immediate production deployment. Self-review and isolated/integrated checks complete. Claude remains unavailable under recorded usage limit; no cross-review was performed or claimed. Changes are presentation/navigation and content equality only; no persistence format, authentication, backend or database changes.

## Production release verification
- Source commit fa3eddd9aa2a19787873f666db3f1786e8cc6605 pushed to origin/main. Cloudflare production deployment https://d53b10a4.asbc-4c9.pages.dev. Production HTML and 10 relevant assets byte-match tested build.
- Deployed PC1440: shared apply opens #/build/skills; base8 → 7; named save/reload preview shows base7 + Daevanion2 = final9; reapply opens editor.
- Deployed mobile390: editor base7 → 6; named save/reload shows base6 + Daevanion2 = final8; node preview visible; reapply editor retains6. Scroll/client widths both375. No false edited-warning after apply or restore.
- Initial and final exported original GreenOrc plans deep-equal. Source public post revision/title unchanged. Five clearly labelled local snapshots remain (original, two initial tests, two deployment tests).
- Isolated production build, isolated and integrated TypeScript, plan-memory, build-library, build-share, public-builds, navigation, account-settings and localization checks passed. Existing chunk-size warnings remain; no gameplay, auth, persistence-format or database changes.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/shared-planner-audit-20261026/{production-assets.json,final-verification.json,production-pc-library.png,production-mobile-library.png,planner-restored-production.json}. Mobile verification used browser viewport, not physical phone.
