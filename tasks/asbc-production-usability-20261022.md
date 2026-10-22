# Production PC/mobile follow-up audit
Owner: Codex. Claude 불가로 Codex 임시 조율 (known usage_limit until Oct 26 14:00 Europe/Helsinki; not retried).
Base commit: af27c423128d1f367a860278759c389d860296e8
Scope: manually audit production changes at PC/mobile sizes; fix only observed beginner UX issues.
Done when: related local fixes verified and audit limitations documented.
Findings: public preview planner link opens home; Daevanion node feedback is below every board; phone map category list pushes map far down. Existing Steam-only screen, connection note, localized map, simultaneous category display and visual macro are present on production.
Verification: PASS typecheck:shadowcraft, lint, all 32 test:shadowcraft suites, build:asbc. CUA production 1440x900 and 390x844; local fixes at 1440/390/320. No horizontal overflow at 320. Node name/cost/status appears directly under inspected board; white outline identifies inspected node. Planner link actually opens build setup.
Last verified: 2026-10-22
Last reviewed: Codex self-review completed; no Claude review claimed.
Uncommitted: only task files; preserve JUHYEONL_FULLSTACK_CONTEXT.md, shadowcraft/tests/__pycache__/_ui.cpython-310.pyc, tasks/collaboration/.
Next: user may request a separate scoped commit/push/deployment. Current improvements are local only.
Blocker: no real Steam account sign-in or private character linkage tested. No new commit/push/deployment requested for this follow-up.

## Manual audit detail
- Production Steam-only account screen and character modal opened/closed on PC/mobile; explanatory roster/points limitation present. Real authenticated account actions not exercised.
- Production map: localized labels, horizontal desktop controls, zoom/reset and gathering + sealed dungeon + stronghold categories together.
- Production public board: real Test post opened with reader navigation, visible skill/Daevanion preview and no automatic apply. No post or reaction submitted.
- Production macro: assassin quickslot grid and individual manual-skill purpose visible on mobile.
- Production ranker: donBshy opened, paired equipment windows and weapon option request visible. Own character missing, so actual two-character comparison/recommendation not manually validated. Daevanion goal opened with 416/136 points, extra nodes visible and apply disabled as intended.
- Three fixes only: public preview planner route, board-local node information/highlight, two-column compact mobile map categories. Backend, auth/storage logic and unrelated changes untouched.
- Proof: D:/CodexData/Projects/ASBC/artifacts/production-usability-20261022/node-detail-mobile.png; build.log. Local Steam count unavailable under local API configuration, not reported as a production defect.

Final isolation check: git diff --check PASS; all 199 pre-existing untracked file SHA256 hashes unchanged. Only 3 frontend source files and this task record changed; no staging, commit, push or deployment.

## Release authorization — 2026-10-22
User explicitly requested the combined scoped main commit/push/production deployment without Claude cross-review. See asbc-ranking-guidance-20261022.md and the release record for subsequent status.
