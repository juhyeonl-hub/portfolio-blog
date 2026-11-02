# Equipment point false missing — 2026-11-02
Owner: Codex. Claude 불가로 Codex 임시 조율: allocation timeout120s, stdout/stderr empty, execution status143/failureKind timeout. No review pass claimed.
[Task Goal]: Correct full stat-only soul-bind responses being classified as missing skill bonuses.
Scope: point-gear reader and regression tests. Preserve mobile and earlier diagnostics changes. No deployment.
Expected: full valid subStats matching positive subStatCount with omitted subSkills => zero skill bonuses; partial/invalid/unknown options remain missing. Existing identity/roll checks retained.
Evidence: official characters/js/index.js translation: subStatCount is number of first soul-bind properties, subSkillCountMax is maximum possible skill effects. Official renderer maps optional subStats and subSkills. GreenOrc EU2311: slots5/19/13 each have4actual stats and subStatCount4, omitted subSkills; greaves have1stat+3skills=4.
Source: https://assets.playnccdn.com/static-aion2/characters/js/index.js?_=202610061430 and official /api/character/equipment/item responses.
Base: c438cdc plus existing local mobile/point changes preserved.
Verification: point-gear regression PASS; CharacterPoints9 tests PASS; typecheck PASS. Official live snapshot replay20/20, errors[], SP383/stigma30/crystal316/battle0/ariel0, report reasons[] and mismatches[]. Production build/lint/postlint PASS; existing chunk-size and plugin-timing warnings retained. git diff --check PASS. First test command used frontend cwd and failed ENOENT lib/classes.ts; corrected to required frontend/shadowcraft cwd, passed. ASBC public POST from Python returned403; no access settings changed; replay used official public endpoints through existing controller-equivalent normalization.
Next: local fix verified, ready for release when authorized. No commit/push/deploy. Physical game totals not independently checked; this is latest official public snapshot.
