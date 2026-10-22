# Simple leveling guide
Owner: Codex. Claude 불가로 Codex 임시 조율: usage_limit until Oct26 14:00 Helsinki; no retry.
Goal: connected GreenOrc templar can see skill and board guidance without applying a plan or opening point controls.
Scope: quick-build.tsx, page.tsx, leveling-guide.css. Existing recommendation and ranker changes preserved.
Expected: fixed catalog/game order; orange only for known actual levels below target; unknown data stays unknown; points and level always visible; board tabs and prerequisite-inclusive targets; no quest tips. Inputs refresh preview without altering saved allocation.
Failure cases: absent skills/boards, failed boards, stale lookup, zero points, locked skills/boards, recommendation failure.
Base: 08736e9. Verification: pending. No commit/deploy requested for this task.
Preserved hashes: {"frontend/shadowcraft/app/ranker-builds.tsx": "a956fe78a94610546f2eaf46525709c5cc6861311c23956c34ace9e49b90200e", "frontend/shadowcraft/lib/recommendation.ts": "1263de3f63d0081a6ec5abf3989daa4d4ad89d83f6239c8849ef6d1e96283748"}

Verification: actual EU/Hadala/Asmodian GreenOrc templar Lv26 connected via local Vite public-API proxy. Actual first-row skills 11/11/7/9/9 match screenshot. PC1440 and mobile390: inputs visible outside details, fixed 5-column skill order, orange target changes at Lv30/SP110/crystal80; SP0/crystal0 clears skill orange, Lv26 locks Vaizel. Mobile no document overflow; board305px, 16 kept/13 target nodes for damage Lv26 estimated91SP/60crystal. Recommendations marked reference/estimated; no game action or plan-apply performed. Removed quick-page stale saved-plan overbudget warning and unrelated collapsed context. Browser screenshot observed, disk save denied EPERM. Budget and ascension tests passed; final build/typecheck pending. ESLint ignores TSX in existing configuration, not counted as TSX lint pass.

Final: typecheck PASS; production build PASS (existing chunk-size and locale-plugin timing warnings); budget/ascension/PvP-leveling regression PASS, all eight classes. git diff --check PASS. Prior dirty ranker-builds.tsx/recommendation.ts hashes unchanged. Temporary browser tab and local proxy server closed. This task is implemented and locally verified; not committed/pushed/deployed.

Release authorization: user said 진행 해 after implementation report; proceed commit/push/main/deploy scoped to this guide, retaining prior no-Claude-cross-review preference. Remote main aligned at 08736e9. Isolated committed-source validation required to exclude older dirty recommendation/ranker changes.
