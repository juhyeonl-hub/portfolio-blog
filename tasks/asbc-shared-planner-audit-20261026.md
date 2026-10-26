# Shared build to personal planner audit — 2026-10-26
Owner: Codex. Claude 불가로 Codex 임시 조율: recorded usage_limit until Oct26 14:00 Helsinki; no retry.
[Task Goal]: Verify production shared build apply, personal editing, named save and reopening on PC/mobile; fix demonstrated issues and deploy only scoped fixes.
Scope: shared-build apply handoff, planner navigation/edit/save UX, scoped recovery and tests. Preserve all existing pending work; no gameplay recommendation changes, auth policy or unrelated features.
Done when: PC1440/mobile390 apply/edit/save/reopen verified; original GreenOrc planner restored; evidenced fixes tested and released if needed.
Inputs/expected: published test post f1337ebe; Fierce Strike base8/final10 and selected Capture node apply exactly; personal edits persist without modifying the source post.
Failure cases: wrong route/class, overwritten personal data without recovery, shared guidance disappearing without notice, budget change, save failure, mobile overflow, stale auto recommendation replacing authored allocation.
Base commit: d5abae93c623cac654f5d47cc3e88d4a08d4c2f6
Verification: in progress.
Last reviewed: pending self-review; user requested direct deployment if issues found.
Findings: pending browser verification.
Uncommitted: baseline captured before changes.
Next: reproduce production apply/edit/save flow.
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
