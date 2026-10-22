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
