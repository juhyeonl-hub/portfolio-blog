# People builds — 2026-10-26
Owner: Codex implementation/verification/release; Claude coordination and read-only cross-review completed.
[Task Goal]: Let visitors find a person's actual character setup and that author's public build posts in a simple dedicated page.
Scope: read-only public author search/count/pagination, existing character search/profile reuse, isolated person page, links from public author names, navigation and translations. No account identity linkage inferred; no private draft/user data exposure; no planner mutation; no unrelated changes.
Inputs/expected: region/class/server/name returns official character selection with actual skill/gear/node details; author name returns only authors with published posts, profile lists only that ID's public posts. Reload/back/direct links retain selected identity. PC1440/mobile390 usable.
Failure cases: unknown/empty name, duplicate visible names, same name on different servers, invalid URL, stale/partial API response, failed boards, wrong class/profile identity, private-only author, escaped wildcard, pagination, request race, mobile overflow.
Done when: scoped tests/typecheck/build and PC/mobile flow verified; prior changes preserved. No guessed gameplay recommendations.
Base commit: e3f6dc08bf9b24a864cef6af686da63463711267
Verification: passed; evidence below.
Last reviewed: Claude d9c632e and827e218 both NO_FINDINGS(0).
Uncommitted: baseline recorded before work.
Next: complete; production verification passed.
Blocker: none.

## Implementation and checks
- Added people page with character lookup and author public-build search; ID-based links distinguish accounts and server+region+character identity distinguishes characters. Personal plans are not set or applied by this page.
- New read-only build-authors endpoint: published-only join, escaped literal substring matching, count and stable 20-row pagination. Existing author-ID build filtering reused. No auth/schema/persistence changes.
- Official GreenOrc (EU Ludra, Templar) search/profile: Lv45, Vicious Strike14, 20 equipment entries and board selections verified on PC1440/mobile390. Direct link/reload and return-to-search retains inputs/results. Missing/failed/locked boards and unknown skill fields are not inferred.
- Author UI uses a named local fixture (one real public author) for the new endpoint; author-filtered post lists and details read production API. New endpoint itself verified by Spring/H2 tests, including private-only accounts, literal percent/underscore, stable pagination and anonymous access. No production write during browser validation.
- PC/mobile author search, empty/error/recovery, author→post→author, reload, English and Korean UI verified. Client/scroll widths375/375 at390;1425/1425 at1440.
- Initial combined backend run failed because existing test classes shared an H2 DB and left foreign keys. Isolated JVMs passed all19 tests; no unrelated tests changed. Two translation omissions were found by AST suite and completed.
- Scoped implementation merged into working tree without modifying preexisting unrelated content; final tests/build passed; user chose to keep implementation pending review.

## Final verification and handoff
- Frontend: integrated and isolated TypeScript passed; people/navigation/public-builds/build-share tests passed; localization passed (57 isolated / 58 integrated screens). Production bundle built successfully. Existing chunk-size warning remains.
- Backend: PublicBuildControllerTest + CommunityControllerTest passed all 19 tests using isolated JVMs. Final author controller rerun passed all 7 including anonymous access. Release JAR packaged successfully.
- All 227 pre-existing pending paths preserved byte-for-byte after subtracting only this task's additions to page.tsx, translations and PROJECT_BRIEF.md. git diff --check passed. No commit/push/deployment performed.
- Screenshots: final-pc-character.png, mobile-character.png, mobile-author.png, pc-author-en.png, pc-search.png under D:/CodexData/Projects/ASBC/artifacts/people-builds-20261026.
- Local new author endpoint UI fixture is not a production verification; backend API covered by Spring tests. Real author directory smoke-test remains for after deployment. Mobile checks used a 390px browser viewport, not a physical phone.
- User decision (2026-10-26, Europe/Helsinki): "구현 상태로 두고 리뷰 후 배포". No review waiver. Preserve implementation and evidence; no commit, push or deployment before review. Existing feature-specific waivers do not apply. No automatic retry or scheduled release has been created.

## Authorized reviewed release — 2026-10-26
- User explicitly requests Claude cross-review, fixes, PC/mobile verification, main commit/push and production deployment. No review waiver.
- Current assembled base commit: e3f6dc08bf9b24a864cef6af686da63463711267; preserves English journey35efa90. Prior implementation base c2d0179 is historical.
- Claude coordination succeeded: tasks/collaboration/runs/asbc-people-release-coordinate-20261026-1793017868802 (status0, scope empty). Codex implements/verifies/releases; Claude read-only exact-commit review.
- Scope: people page, character/author lookup, navigation and author links, relevant translations/tests; new read-only build-authors endpoint. No schema/auth/storage changes. Unrelated SEO/ledger/other pending work excluded.
- Review candidate only: not yet main, pushed or deployed. New checks and review are pending.

## Cross-review and UI follow-up
- Claude exact-commit review d9c632ef8c42d9415867555b71b651d095653dab completed with NO_FINDINGS (0), exit0; .agents/reviews/d9c632ef8c42-1793018365994.
- PC audit on current main + people scope: real GreenOrc EU/Ludra Lv45, Vicious Strike14, 20 equipment entries, Nezekan and Zikel board views; returning to search retains name/server. 1440 viewport client/scroll1425.
- Author fixture: empty search, simulated503, recovery to partial-name search; author posts read real production API.
- UI follow-up: reuse Results: {0} and Public builds: {0} English count phrasing so a single result no longer says 1 results / 1 public builds. No other behavior changes. Incremental review requested.

## People builds reviewed release — 2026-10-26
User authorized Claude cross-review, fixes, PC/mobile verification and main/push/production. Scoped feature provides game-character current setup and site-author public posts through separate tabs. New anonymous build-authors endpoint exposes only published-post authors and public count; no schema/auth/storage changes.
Claude read-only review d9c632e and incremental review827e218 both NO_FINDINGS(0). Frontend type/people/navigation/public-build/share/localization checks passed; backend78 tests passed with isolated JVMs; release JAR and ASBC bundle built. PC1440/mobile390 browser viewport checks covered real GreenOrc(EU Ludra), skills/equipment/boards, author search and public post links, reload/back, no horizontal overflow. Pre-release author-directory UI used an explicit fixture; production API/UI verification follows deployment. Existing English journey retained; all unrelated pending work excluded. Evidence: D:/CodexData/Projects/ASBC/artifacts/people-builds-20261026/release.

## Production completion — 2026-10-26
- Main and origin advanced to f9a4755 (implementation d9c632e, English count refinement827e218, review/check recordf9a4755). Both Claude reviews completed NO_FINDINGS(0).
- Database dump verified; previous JAR retained. Tested JAR deployed and local/public health plus anonymous author endpoint passed. Initial Python urllib public health request returned403; subsequent standard curl health/directory checks passed without configuration/security changes.
- Pages deployed: https://205a1978.asbc-4c9.pages.dev ; https://asbc.app HTML and12 related assets match the built output.
- Actual production anonymous author directory shows1 author and2 public builds; author-ID filtered count agrees. No fixture in deployed code.
- Production PC1440: GreenOrc EU/Ludra Lv45, Vicious Strike14,20 gear entries, Nezekan50 and Zikel45 selected-node counts, author directory. Mobile390: actual author partial/empty search, public post→author, reload, character direct link and skills/boards/equipment. Client/scroll1425/1425 and375/375; no console errors. Mobile is a browser viewport, not a physical-device test.
-249 baseline paths checked; only task-owned record and count wording changed. Inverse checks verify unrelated content in mixed translations and PROJECT_BRIEF unchanged. Pending SEO/ledger/other work remains local.
- Evidence and screenshots: D:/CodexData/Projects/ASBC/artifacts/people-builds-20261026/release/production-verification.json.
