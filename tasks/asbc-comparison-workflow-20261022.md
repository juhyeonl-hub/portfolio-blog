# Steam and character growth workflow — verified locally
Owner: Codex — Claude 불가로 Codex 임시 조율; usage_limit until 2026-10-26 14:00 Europe/Helsinki, no retry.
Base: ba7a012. No stage, commit, push or deployment in this task.
Scope: Steam-only sign-in UI and default password-auth rejection; character modal hides its scrollbar while preserving scrolling and restoring body overflow; Steam roster capability note; progression-aware investment guidance; paired visual equipment hover/focus/click comparison; budget-independent Daevanion goal boards.
Steam limitation: OpenID supplies SteamID, not Aion2 character roster. First lookup remains by name; existing recent-character list is available. No hidden roster endpoint assumed.
Equipment: ranker level no longer gates investment. Level 70 is a transparent site advice threshold, not an official dungeon requirement. Progression use supports limited investment even below threshold. Actual item identity validation retained; unknown rolls do not produce false advice.
Daevanion: actual imported nodes (or local plan fallback) vs validated ranker goal; green shared, red differing own choice, orange missing target. Red is not universal uselessness. Insufficient points or unopened own boards no longer block viewing; applying impossible allocations remains disabled. Public identity, board completeness and connectivity checks retained.
Verification:
- Frontend typecheck and lint PASS.
- All 32 frontend test suites PASS, including updated equipment advice and budget-independent preview cases.
- Backend mvn test: 67 tests, 0 failures/errors/skipped. Steam start/exchange and existing auth regressions included; default password login/register rejection added.
- equipment_advice.py PASS at 1440/390/320: both equipment windows, actual paired rolls, Lv70/80 vs Lv102, lower gear progression exception, malformed identity/retry, no unsolicited item fanout, plan unchanged.
- steam_login.py PASS: first/returning Steam flows, errors, safe redirect, old active-session Steam linking, Steam-only signed-out controls, English.
- comparison_workflow.py PASS: zero-budget preview, all board images, green/red/orange, tap details, invalid application disabled, cancel/nonmutation; 1440/390/320 modal no visible scrollbar and bottom content accessible, body scroll restored.
- ranker_ui.py PASS: eight classes, normal preview/apply/undo and mobile regressions.
- Final build: VITE_ASBC_NEW_ORIGIN=https://asbc.app npm run build:asbc PASS (existing bundle-size/plugin-time warnings).
- git diff --check PASS.
Evidence: D:/CodexData/Projects/ASBC/artifacts/comparison-workflow-20261022.
Found and fixed during browser checks: generic empty-state padding enlarged empty gear slots; 320px bottom slot row overflow; board coordinate origin corrected to actual node bounds. Initial obsolete test expectations and startup waits updated.
Preserved unrelated untracked paths: JUHYEONL_FULLSTACK_CONTEXT.md; shadowcraft/tests/__pycache__/_ui.cpython-310.pyc; tasks/collaboration/.
Review: auth cross-review pending; solo testing is not cross-review approval. No real Steam account interaction or game writes performed by browser fixtures.
Next: Claude read-only review of authentication change when quota resumes, then release only upon requested release scope.
