# ASBC account settings release — 2026-10-24

- Owner: Codex. Claude 불가로 Codex 임시 조율 (known usage limit; not retried).
- Base commit: 8e5e74fc44da77076abd76f9bbe614acbb13bc76.
- User authorization: "이번 계정 동기화까지 리뷰 없이 전체 배포". Explicit exception for this release; no Claude review pass claimed.
- Scope: authenticated per-account settings storage, browser account/guest isolation, server restore, offline/conflict recovery, saving status and privacy disclosure. Only 19 scoped implementation/test files plus this record.
- Excluded: home connection-status disclosure changes (home-panel.tsx/globals.css/translation deletion), existing task/collaboration logs and other unrelated files. 206 excluded dirty/untracked baseline files verified byte-identical.
- Done when: scoped main commit pushed, V18 and backend deployed before frontend, public production routes and PC/mobile screens checked.
- Last reviewed: self-verification; cross-review waived by user, not performed.
- Last verified: 2026-10-24, isolated D-drive source and build.

## Verification
- TypeScript, ESLint, account-settings suite, character-point UI 8 tests, localization and production ASBC build: PASS.
- Backend full verify: 72 tests PASS with class-isolated JVMs (`-DreuseForks=false`, installed Mockito agent). Initial default shared JVM run: 5 PublicBuildControllerTest setup errors caused by pre-existing H2 foreign keys left by another test. No assertion failures; no production/test sources changed to hide this issue.
- Previous two-origin PC/390px browser acceptance remains valid: account isolation, offline reload/retry, optimistic conflict recovery, guest restore and confirmed points. Evidence in ../artifacts is kept at D:/CodexData/Projects/ASBC/artifacts/live-point-guidance-20261024.
- PostgreSQL V18 DDL and ON DELETE CASCADE checked in an isolated transaction/schema; rollback confirmed. Production current schema V17 before release.
- Verified fresh production backup: /home/juhyeonl/portfolio-blog-ops/backups/portfolio_blog_20261024T145634Z_before-settings.dump. Old backups not pruned.
- Local and public /api/health return status ok. Default Python urllib public probe was rejected by CDN (1010); standard curl and browser work. No security settings changed.
- Tested JAR SHA256: 90bbe2c95f53e95fb1557a49cac5a984103842d7c8d159d77d0fd75b5253ecdd.

## Release plan / limitations
- Existing same-user systemd service has Restart=always (10 seconds). Preserve old JAR, install verified JAR by atomic rename, send TERM only to the verified same-user MainPID, check recovery; restore old JAR on startup failure. No sudo/root or permission changes.
- No new environment variables/proxy changes. V18 is additive. Never restore the database automatically.
- Backend success precedes main push/frontend release. Cloudflare Pages asbc/main uses existing CLI login.
- Actual Steam sign-in across two physical devices is not verified; user explicitly accepted this remaining verification when approving release. No real-user credentials/session tokens were fabricated or read from storage.
- Sync restores on login/app start/retry, not continuous live push. Settings include plan inputs/confirmed balances, timers, map progress, favorites and locale; full character responses, search history, saved build-library documents and gear notes remain local.
- Artifacts: D:/CodexData/Projects/ASBC/artifacts/account-settings-release-20261024.
- Next: deploy backend, then push/frontend, record production verification.
