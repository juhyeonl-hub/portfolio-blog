# Guide and ranking flow usability follow-up
Owner: Codex. Claude 불가로 Codex 임시 조율 (recorded usage_limit until Oct 26 14:00; not retried).
[Task Goal]: Make ranking-to-comparison and budget-aware Daevanion guidance easier to understand on PC/mobile.
Base commit: b6b79d2
Scope: ranker-builds.tsx, ranker-boards.tsx, globals.css, ui-translations.json only, plus this task record.
Expected: selected ranker immediately identified; chooser collapses after selection; guide before equipment; explicit target/own/recommended totals; node feedback beside board; desktop and phone usable. Missing live data keeps existing errors and apply protection.
Findings: production mobile repeats 10-person list after choosing a ranker; guide buried below equipment; unlabeled target/own fractions and long explanation delay board visibility.
Verification: pending. Last verified: 2026-10-22. Last reviewed: self-review pending.
Uncommitted: scoped changes only; existing 199 untracked files preserved.
Next: implement and validate locally. Blocker: none. No commit/push/deployment in this task.

## Completed local validation
- Production CUA audit at PC 1440 and mobile 390: selected ranker still followed by repeated ten-card list; target guide buried below equipment; unlabeled fractions and long explanation.
- Changes: comparison title names selected ranker; collapsible chooser after selection; ranking return link; Daevanion preview before equipment; three labeled cost totals with estimated-budget notice; compact mobile legend; optional criteria details; selected-node outline and name/status/cost above board.
- Typecheck, lint, localization, navigation, ranker-builds tests and production build PASS. Existing >500kB bundle warning remains. No recommendation/storage/auth algorithm changed.
- Local synthetic profile fixture only: 416 target vs default 136 budget, zero Azphel; PC1440, mobile390/320 screenshots inspected; tabs, node feedback, disabled full apply, choose different ranker and return-to-ranking all verified. No live private account or plan application tested.
- Initial fixture launch failed due to module relative cwd; corrected to frontend/shadowcraft and succeeded. Two same-name nodes required an explicit first-node locator for the UI check; not an application failure.
- All 199 unrelated hashes unchanged. git diff --check PASS. Source edits limited to four declared files. No commit/push/deployment.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/guide-flow-audit-20261022 (guide-flow-pc.png, guide-flow-mobile.png, build.log).
Last reviewed: Codex self-review. Last verified: 2026-10-22. Next: ready for scoped release if requested. Blocker: none.

## Release authorization — 2026-10-22
User explicitly authorized only this verified scope for main commit/push/production deployment without Claude cross-review. Supersedes earlier local-only status. Review waived, not claimed as passed. All 199 excluded file hashes unchanged before release.
Release candidate: typecheck, lint, localization, navigation, ranker-builds and production build PASS; git diff --check PASS. Only four UI/translation files plus this record staged.
