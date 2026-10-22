# ASBC combined UI release — 2026-10-22
Owner: Codex. Claude 불가로 Codex 임시 조율.
Base commit: ba7a012 (origin/main equal at release preparation).
Scope: verified Steam-only login, character modal and roster capability note; progression-aware paired equipment comparison and Daevanion preview; map usability/localization/resources; public board/read-only visual preview; macro quickslot layouts and individual skill purposes; nonofficial outbound navigation removal.
User authorization: selectively commit, push and deploy these changes; exclude unrelated work.
Done when: scoped commit pushed, cross-review gate resolved, backend and frontend production verified.
Verification: frontend typecheck/lint and 32 suites PASS; official-url tests PASS; production ASBC build PASS; backend mvn package PASS, 67 tests, zero failures/errors/skips. No source changes since recorded passing PC/mobile/browser checks in the three feature handoff records.
Last verified: 2026-10-22. D artifacts/ui-release-20261022 contains logs, manifest and unrelated-file hashes.
Last reviewed: self-verification only. Claude cross-review pending; usage_limit until Oct 26 14:00 Europe/Helsinki, no retry.
Findings: origin/main matches base; no existing staged changes; all 48 selected feature/test/handoff files belong to the requested changes. Current operations still use the previous production release.
Uncommitted exclusion: JUHYEONL_FULLSTACK_CONTEXT.md, shadowcraft/tests/__pycache__/_ui.cpython-310.pyc, tasks/collaboration/. Contents verified unchanged by SHA256 (199 files).
Release handling: commit and push on release/asbc-ui-20261022; main and production remain unchanged until the explicit cross-review gate is resolved. This is a prepared release, not a deployment or review approval.
Next: obtain user exception specifically permitting this release without Claude cross-review, or wait for that review; then merge the scoped commit to main, push, deploy backend before frontend and verify production. No automatic follow-up scheduled.
Blocker: tools/shared-agents/COLLABORATION.md says authentication/storage/deployment work stops at implementation with cross-review pending while Claude is unavailable. General deployment authorization is not recorded as a waiver of that explicit review condition.

## Release completed — 2026-10-22
The user explicitly authorized this release without Claude cross-review: "이번에는 Claude 교차 리뷰 없이 네가 검증한 걸로 main에 반영하고 원격에 푸시해서 운영에도 배포". This is a release-specific exception, not a Claude review pass. The earlier Next/Blocker and prepared-only statements are superseded.
- Source commit c8d47c0ca34664e71f3dd57d17190daf768d842d fast-forwarded to main and pushed; no unrelated changes merged.
- Verified fresh DB backup: portfolio_blog_20261022T100006Z.dump. Existing old backups were not pruned.
- Previous backend JAR preserved at /home/juhyeonl/portfolio-blog-ops/blog.jar.before-ui-c8d47c0. Verified release JAR installed atomically; existing same-user systemd supervisor restarted the service. New MainPID 3527645; active/running. Installed JAR SHA256 equals verified D artifact.
- Actual production health: local configured port 8081 and https://asbc.app/api/health return 200. Password login/register with empty body return 403 with Steam-only message (no account created). Steam start returns 302 to steamcommunity.com. No real user Steam credentials or account mutation used.
- Cloudflare Pages asbc/main deployment succeeded: https://b5f5cb3a.asbc-4c9.pages.dev . asbc.app initial JS/CSS hashes equal the verified build (asbc-CxSZ3tBk.js, asbc-JJWGFisW.css, dependency chunks).
- Production-origin browser suites PASS: public_build_flow.py, steam_login.py, map_usability.py, comparison_workflow.py, equipment_advice.py. PC/mobile 1920/1440/390/320 where applicable; both factions, all 8 classes, saved-plan nonmutation, actual rendered controls. Account/character/post write scenarios use isolated API fixtures; live API health/auth routing checked separately above.
- Initial local health probe used default 8080; inspected actual running port and succeeded on 8081. Non-browser HTML hash probe was denied by existing policy; normal browser session succeeded, no policy changes.
- Excluded 199 unrelated files retain original SHA256. Remaining untracked entries: JUHYEONL_FULLSTACK_CONTEXT.md, shadowcraft/tests/__pycache__/_ui.cpython-310.pyc, tasks/collaboration/.
- Done: main/source push, backend/frontend production deployment and verification. No release blocker remains. No scheduled follow-up.
