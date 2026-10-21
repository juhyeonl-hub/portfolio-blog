# Full boss timer pins
Owner: Codex, allocated by Claude
Scope: all public A2Tools boss records, searchable pin picker, additive settings/API compatibility. No exchange/market collection.
Done when: backend/frontend tests, browser checks, Claude cross-review, authorized production deployment verified.
Base commit: 98dcd0603771881572516732947bd217117c6187
Verification: typecheck, lint, 31 frontend test scripts, full mvn test, ASBC + default frontend builds and backend package passed. all_boss_pins.py passed: 49 catalog + unknown ID, search/filter, observations/missing data, 50 pins, reload/navigation, 320/390/1366 widths. timer_pins.py, boss_timers.py, event_timers.py, population_timer_sync.py all passed. Mobile screenshot visually inspected.
Last verified: allocation execution status 0, empty write scope, 2026-10-21
Last reviewed: 2026-10-21 Claude cross-review approved; execution status0, empty write scope. Low unknown-faction label improved; standard curl confirms49records bothservers, live backend check remains.
Findings: feed has 49 numeric boss IDs; old backend truncates to four aliases. New allBosses/pinnedBosses fields preserve old clients and settings. Catalog includes both factions plus shared boss; exact IDs persist across servers with faction/map labels.
Uncommitted: task changes only; preserve unrelated JUHYEONL_FULLSTACK_CONTEXT.md, __pycache__, tasks/collaboration/.
Next: no implementation work remains; task commit/push authorized. Preserve unrelated untracked files.
Blocker: none

Production: backend deployed after verified fresh DB backup portfolio_blog_20261021T172406Z.dump, rollback JAR blog.jar.before-all-bosses-20261021T202407. Existing same-user service supervisor restarted after graceful MainPID termination; no auth/service settings changed. Local/direct/proxied health200, allBosses49, legacy4, fetchedAt>0 and refreshFailed=false.
Frontend final deployment: https://9bb65909.asbc-4c9.pages.dev ; https://asbc.app serves asbc-DFnnx9M9.js. Complete artifact at D:/CodexData/Projects/ASBC/artifacts/all-bosses-20261021 (1890 hashes matched source before final deploy). First deployment started before artifact copy completed and was superseded; final custom-domain bundle and full browser tests verified.
Production verification: real API+49-option picker/new boss cards PASS; all_boss_pins.py PASS with controlled feed; timer_pins.py PASS. Evidence D:/CodexData/Projects/ASBC/evidence/all-bosses-20261021.

