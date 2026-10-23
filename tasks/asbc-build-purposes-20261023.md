# Build purposes
Owner: Codex / single writer. Base: a722e25d9478eb3611e5db7f7901f979c97f8cc8.
[Task Goal]: Replace vague attack/survival purpose choices with Leveling (under 45), PvE (expeditions from 45), and PvP.
Scope: QuickBuild purpose adapter/UI, local style, translations, focused purpose tests. Do not change saved plan schema, point accounting, character data, or unrelated pending work.
Expected: non-PvP purpose follows level across 44/45; PvP stays explicitly selected. Disabled age-incompatible choice cannot silently change level or point totals. Leveling uses existing attack priorities and level gates; PvE uses existing boss/party survival-aware priorities and excludes PvP-only stat nodes; PvP keeps existing rules. No claim of expedition-specific optimal build or PvP skill optimization.
Authorization: immediately deploy these small UI changes per user. Prior no-Claude-cross-review preference applies. Claude 불가로 Codex 임시 조율: known usage limit until Oct 26; no retry/pass claim.
Evidence: D:/CodexData/Projects/ASBC/artifacts/build-purposes-20261023.
Pending overlap: QuickBuild and translations must retain original pending diff. All other pre-existing files unchanged.
Verification: pending.

Verified before final layout adjustment:
- Focused tests pass for all eight classes: 44/45 boundary, legacy safe/damage defaults, explicit PvP persistence, source-plan immutability, point totals, skill gates, connected/unlocked boards, no PvP-only stat nodes for leveling/PvE.
- Isolated typecheck and production build pass; existing chunk-size/plugin timing advisories only.
- PC 1440x900 templar: 44 selects leveling; 45 selects PvE; manual 370 Daevanion survives PvE/PvP toggles. 30-level PvP remains selected until explicitly choosing leveling. Source character and manual allocation not overwritten.
- At 370 points, two browser commands exceeded the tool's 3-second wait during existing synchronous recommendation calculation; subsequent DOM checks confirmed the requested updated results. This task does not include the unrelated pending recommendation performance patch.
- Mobile 390x844: width 375 equals scroll width, buttons usable. Final CSS stretches all three purpose buttons to equal row height.
- All 210 unrelated pending file hashes unchanged; two overlapping pending diffs exactly retained relative to scoped release files.
Final verification: build PASS after layout adjustment. Mobile all three purpose buttons are 61.6px high with no horizontal overflow. New English labels and purpose explanation verified; Korean restored. All six source hashes match scoped release; original overlapping diffs preserved.

Production release complete: source bb1ea5ec5ba83a8df4c90850e0a1e30183396f77 pushed; deployment https://c0837505.asbc-4c9.pages.dev. Canonical https://asbc.app/ returns 200 and all four entry assets match tested hashes (production-verification.json). Deployed templar PC shows PvE at 45 with skill results; mobile level 30 switches to Leveling with 12 skills, equal 61.6px buttons and no overflow (375=375). Screenshot production-pc.png. Final checks preserve 210 other pending files and exact pending diffs in both overlapping files. Temporary server and tabs closed. No cross-review claim.
