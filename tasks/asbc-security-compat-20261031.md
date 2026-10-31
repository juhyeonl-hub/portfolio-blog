# ASBC translation gaps and supported security platform
Owner: Codex; Claude allocation and read-only cross-review.
[Task Goal]: Finish remaining translation gaps and migrate to a supported patched backend platform, preserving existing storage/auth/API contracts and unrelated work.
Base: 2c22fb4ba77310a19cdba827d3958b27349cc583.
Scope: 5 UI message keys (4 missing keys across eight translated languages; correct recommendation-apply wording), conditional translation-key coverage, Boot 4.0.9 / Framework 7.0.10 / Java 21, official temporary Jackson 2 bridge at 2.21.8, modular starters and necessary test imports. No schema changes, security policy changes, or user-data migration.
Authorization: user said 다음 진행 for remaining locale/security work; prior explicit reviewed scoped deployment authorization persists. Existing 302 primary-tree changes and 525 prior untracked files must remain byte-identical.
Risks and mitigation: JSON mapper-family mixing (explicit Jackson 2 and exclude Jackson 3 starters; tested actual converter family and classpath), Hibernate schema drift (18 real PostgreSQL Flyway migrations plus ddl-auto=validate), matcher/CSRF/session regression (full tests and actual API calls), websocket serialization (real host-to-guest network exchange).
Verification:
- mvn -B verify: 118 tests, 0 failures/errors/skips; packaged JAR.
- npm run test:shadowcraft: all suites PASS. Typecheck PASS. Localization coverage 71 screens PASS, including conditional/array-selected t() keys. SEO 14 guides / 15 sitemap URLs PASS. ASBC production build PASS; committed-source rebuild follows review.
- Temporary PostgreSQL 14 cluster: prior production JAR creates schema, account session, settings, and public build. Final upgraded runtime validates 18 migrations and Hibernate schema; old cookie remains valid; four canonical JSON response hashes identical; settings/build writes, public anonymous read, unauthorized/missing-CSRF/malformed input rejection PASS.
- Actual WebSocket relay preserves role, Unicode, numbers and arrays PASS.
- Current resolved backend production dependencies: 104 checked against OSV, 0 reported advisories. npm production audit 0. Development-only npm audit retains 6 moderate transitive reports for one minimatch advisory; no compatible upstream fix reported, no forced major override or suppression.
- PC/mobile browser: English recommendation apply and local save/restore; mobile skill edit/save and German multiline button fit. Separate test origin, no production plans changed. Final browser/account evidence in artifact folder.
Initial failures: guessed LocalServerPort move corrected; extra regression gate revealed Spring Data Jackson 3 projection converter, removed default Jackson 3 starter paths. Then assertion was corrected to accept the legitimate ProjectingJackson2 converter and explicitly reject Jackson 3 classes. Final checks pass; failed logs retained.
Claude allocation: asbc-security-compat-plan-20261031-1793476959672, complete status0/scope[].
Cross-review: PASS, asbc-security-compat-review-20261031-1793478752687; execution finished2026-10-31T20:37:19Z, status0, error=null, scope[]. No blockers.
Next: scoped commit/push, clean committed-source build, private database backup, service/web deployment and production smoke.
Known follow-up: official spring-boot-jackson2 is deprecated compatibility support, retained intentionally to preserve current JsonNode/storage contracts; migrate to Jackson 3 as separate tested work. Development minimatch advisory remains limited to lint tooling.
Artifacts: D:/CodexData/Projects/ASBC/artifacts/security-compat-20261031/.
