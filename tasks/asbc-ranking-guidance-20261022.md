# Ranking and budget-aware Daevanion guidance
Owner: Codex. Claude 불가로 Codex 임시 조율; known usage_limit until Oct 26 14:00, no retry.
Scope: board tabs and larger grids; budget-constrained connected target paths; rankings separated from build comparison. No deployment requested.
Base commit: af27c423128d1f367a860278759c389d860296e8
Prior work preserved: 3 follow-up frontend edits and tasks/asbc-production-usability-20261022.md; unrelated untracked files unchanged.
Done when: target paths validated across classes/currencies/levels; PC/mobile routing and tabs checked.
Verification: final typecheck/lint/build PASS; target-path (8 classes, zero/10/370/unlimited budgets, target-only connectivity, level gates, separate currencies, nonmutation), navigation and localization PASS. Final expanded target-path rerun including exact 416-to-370 case PASS.
Last verified: 2026-10-22
Last reviewed: Codex self-review completed, no Claude review claimed.
Findings: reuse existing recommendation weights, restrict graph to target nodes, display reallocation assumptions, never auto-apply. Blue includes owned nodes outside the budget recommendation. Rankings are explicitly sampled combat-power rankings, not official global rankings.
Uncommitted: source and tests for this scope plus prior local follow-up.
Next: local changes ready for user review; no commit/push/deployment performed.
Blocker: none for local implementation; no live deployment.

## Direct browser validation
CUA local PC 1440 and mobile 390/320: ranking list has 10 compare actions, zero character-connect/analysis panels; selecting an entry opens #/build/compare with that character selected and Build active. New build comparison pill and mobile selector present.
Local fixture ONLY (not live account): 416 target crystals + 63 Azphel, entered own cap 370 + 0; rendered recommendation 370/370 + 0/0. All five board tabs switch a single large grid; orange priority, blue deferred; Azphel entirely deferred at zero cap. No horizontal overflow at 320/390. No automatic plan application.
Local real profile query returned unreadable responses; not counted as live character validation. Separate temporary fixture server used, no production modification. Existing Python UI scripts updated for navigation/board tabs but not executed in this task; manual browser + pure algorithm tests performed.
Artifacts: D:/CodexData/Projects/ASBC/artifacts/ranking-guidance-20261022 (build.log, target-path.log, mobile/PC screenshots).

## Release authorization — 2026-10-22
User explicitly authorized this scope plus the production-usability follow-up to be committed to main, pushed and deployed, without Claude cross-review. This supersedes the earlier local-only status. Claude review is waived for this release, not recorded as passed. Unrelated files remain excluded.

Release candidate verification: all 33 test:shadowcraft suites, typecheck:shadowcraft, lint, production build and git diff --check PASS. Logs: ranking-guidance-20261022/release-tests.log and release-build.log. All 199 pre-existing excluded file hashes unchanged.
