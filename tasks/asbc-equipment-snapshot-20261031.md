# Equipment comparison lookup snapshot
Owner: Codex (Claude read-only allocation and review).
Task Goal: fresh lookup on ranker selection/refresh, prefetch options with concurrency2 and reuse during this comparison; hover/tab/advice changes send no duplicate item requests.
Base commit: 635ceb12db37e4da0fe8e31eeca4022712a4d826
Scope: comparison UI, per-comparison queue, armory request cancellation/status, backend lookup namespace/in-flight coalescing, focused tests and this record. Preserve primary302 unrelated entries and prior worktree files.
Done when: refreshed same-ID changed options are observed; bounded/deduplicated/cancellable requests; cached success and failure reused during browsing; PC/mobile actual UI verified; Claude review and scoped production deployment.
Design: Claude allocated Codex implementation and Claude review. Its frontend-only suggestion was insufficient for explicit freshness: the15-second shared backend cache can return another visitor's options. Implement UUID namespace per selection/refresh for character URLs; new namespace misses old cache, within-lookup duplicates coalesce. Existing120/min and8-request semaphore, validation, response-size bounds and timeout stay intact. Legacy callers keep short shared cache. LRU removes one oldest entry instead of clearing everything. Parent owns queue across equipment/skill/board tabs. No persistent browser cache, authentication or plan changes.
Inputs: currently selected ranker and optional linked character. Outputs: identified, timestamped actual options. Failures: per-item retry; changed equipment asks for character refresh;429 stops remaining prefetch; canceled comparisons cannot publish results.
Verification: pending.
Last verified: pending.
Last reviewed: allocation completed status0, read-only scope[].
Findings: original per-card effect reissued requests on every slot remount; backend15-second shared response cache and no in-flight dedupe.
Uncommitted: scoped implementation pending verification.
Next: tests, browser checks, review, scoped commit/push and server/web deployment.
Blocker: none.
Authorization: user “좋아 그렇게 진행” after fresh-selection/cached-browsing explanation; standing “이런 작은 건 들은 바로바로 배포 해”.
Artifacts: D:/CodexData/Projects/ASBC/artifacts/equipment-snapshot-20261031/.

## Verification completed 2026-10-31
- Frontend TypeScript and production build PASS.
- equipment-options, armory, equipment-advice, ranker-builds, character-comparison, localization suites PASS. Ranker suite includes 56 budget cases, 576 skill guide cases and 32 combined board/skill cases.
- Backend focused12 tests: ShadowcraftSnapshotTest4, ShadowcraftEquippedItemTest3, ShadowcraftLookupLatencyTest1, ShadowcraftControllerTest4; zero failures/errors/skips. First run failed due nested Mockito test stubbing, corrected test setup then all passed.
- Real browser controlled fixtures: PC1440x1000 and mobile390x844. Initial25 item requests unchanged after7 slot selections and equipment/skill/board roundtrip. Explicit refresh kept item IDs/enchant same but generated option1.0% changed to2.0%, adding exactly25 requests. Mobile3 repeated slots and tab roundtrip added0. Rapid selection aborted old queue after4/25, new selection25/25. English locale switch added0. No horizontal page overflow. Fixture options are synthetic and do not establish game values; skill/board guide not modeled by fixture.
- Backend tests verify namespace isolation even when ID/enchant unchanged, invalid UUID blocked before network, same-namespace coalescing, failure retry. Queue tests cover2 active across both identities, duplicate removal, cancellation, retained errors and429 halt.
- Claude initial read-only review timed out (status143, failureKind timeout, empty output); one allowed narrowed retry succeeded status0/scope[] and explicitly PASS with no blockers. Review covered security/freshness and queue, but no tests run or full git diff by reviewer; locale copy not read. Codex separately ran tests/typecheck/localization and inspected wiring.
- Review: tasks/collaboration/runs/equipment-snapshot-20261031-review-retry-1793450522260/reply.txt.
- Primary302 pre-existing dirty entries remain unchanged. Worktree prior files preserved; owned collaboration active.lock is transient runtime metadata, excluded from byte comparison and never committed.
- Existing production LeekGirl mainhand lookup returned502 before this release; ReTry loaded correctly. Do not modify user character/plan to mask this existing upstream failure.

## Authorized release
User “좋아 그렇게 진행” approves the discussed behavior; standing “이런 작은 건 들은 바로바로 배포 해” authorizes scoped main commit/push and production release without another confirmation. Release only these11 files, from clean committed archive, preserving all unrelated work. Server UUID namespace and front-end queue ship together; server first. Prior JAR and private database backup retained for rollback. No schema/auth/plan persistence changes.
Last verified: tests and controlled PC/mobile passed.
Last reviewed: Claude read-only retry PASS, no blockers, limitations above.
Next: scoped commit/push, clean archive packaging, backend then web deployment, production PC/mobile checks.
Production outcome and immutable commit/build hashes: D:/CodexData/Projects/ASBC/artifacts/equipment-snapshot-20261031/release-result.json (avoids self-referential commit).
