# ASBC search discovery — release 2026-10-26
Owner: Codex implementation, verification and release; Claude coordination and exact-commit read-only review.
[Task Goal]: Help Global Steam players discover ASBC through useful English-first tool guides with Korean equivalents.
Scope: 14 static guide pages (two indexes and six topics per language), readable root HTML, metadata/sitemap, app-footer guide links, initial browser-language detection and the Google-issued public Search Console verification tag. No ledger-summary, other pending work, backend, auth, schema, game-rule or additional app-language changes.
Done when: guides and tools work on PC/mobile, Claude exact-commit review is resolved, only scoped changes reach main/remote/Cloudflare Pages, production URLs are checked and Search Console sitemap submission is confirmed or accurately recorded as blocked.
Base commit: 50ebdfaf1e474fce120d28512b12c45297051921
Inputs/expected: buy130000 x100, sell150000, tax10%, registration fee0 => profit500000 at lot sizes25/50/100. Saved ko/en/ja/fi wins; unsupported new-browser language => English. No-JS guides have self-canonicals and reciprocal en/ko/x-default links.
Failure cases: stale labels, broken links/canonical/sitemap, empty initial HTML, invalid locale defaults, unsupported game claims, mobile overflow, API proxy omitted or unrelated source included.
Verification: SEO checks, all44frontend suite commands, TypeScript and production build passed. All15sitemap URLs and internal guide assets returned200 locally without JavaScript. All14guides fit PC1440 and mobile390; trade guide also fits320. English/Korean switches, guide→public builds, guide→Player builds, app footer→guide and actual calculator500000 result/lot comparisons checked. Saved Korean preference survived reload; English restored through UI.
Last verified: 2026-10-26, local release build. Browser mobile viewport only, no physical-device claim.
Last reviewed: Claude coordination completed with status0/error=null; exact-commit review pending. Prior2026-10-25 work was self-reviewed while Claude unavailable; not recorded as cross-reviewed.
Findings: updated budget wording to used/remaining/total and added current public-build apply/edit/save/share/author flows. Fixed guide menu wording to actual Player builds. No unverified probabilities, live hidden-cube positions, guaranteed spawns/profit or confirmed remaining-point claims.
Uncommitted: isolated task worktree prepared from current main. Primary243-path baseline preserved; original SEO drafts remain pending until this release merges. Ledger summary, home/globals, other translations and their package test entry excluded.
Next: exact-commit Claude review, main/push/Pages, production HTTP/browser checks and Google verification/sitemap submission.
Blocker: none currently. Search Console property pending verification; no claim of indexing or traffic yet.

## Implementation and boundaries
- Six topics: trade calculator, public builds/player lookup, build planner, Daevanion, event timers and map/collections. English and Korean guides render fully without JavaScript and use existing tool routes.
- Root fallback contains readable links. App footer exposes the guide index after mounting. Existing saved language wins over browser preference; unsupported browser language defaults to English.
- Metadata: unique titles/descriptions, self-canonical, reciprocal language links, Open Graph/Twitter and visible-content WebPage/CollectionPage JSON-LD. No invented ratings or game authority.
- Public build guide distinguishes current game character setup from site-author posts, copied planner plans from original posts, and live post links from allocation snapshots. Save important current plans before applying another build.
- Google URL-prefix property was opened in the user's already-signed-in account. Its exact public HTML verification token was copied into root HTML; no credential, permission, DNS or account security settings were changed. Verification and sitemap submission wait for published production URLs.
- Existing bundle-size and locale-plugin timing warnings remain. Local browser preview proxies public API calls to production; no mocked content or new login claim.
- Windows-mounted worktree uses per-process core.filemode=false only. Shared/global Git config remains unchanged. node_modules is an ignored symlink to existing dependencies.

## Evidence
- Current release: D:/CodexData/Projects/ASBC/artifacts/search-release-20261026/ (baseline.json, tests.log, typecheck.log, build.log, http-local.json, browser-guides-local.json, screenshots).
- Previous draft: D:/CodexData/Projects/ASBC/artifacts/search-discovery-20261025/.
- Claude coordination: tasks/collaboration/runs/asbc-search-release-coordinate-20261026-1793029978453; completed read-only, status0/error=null.
- Primary references: https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript and https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

## Release checklist
1. Commit exact scope, run official Claude review, fix actionable findings and verify relevant changes.
2. Preserve unrelated primary files while advancing main; push normally, deploy from frontend/asbc-pages to bundle existing API functions. No backend deployment.
3. Verify production root, all14guide URLs, sitemap, CSS/icons, canonical/alternate/meta, tool routes and API content type.
4. Verify Google ownership and submit https://asbc.app/sitemap.xml, then inspect a representative English URL. Record pending processing honestly; submission is not indexing or a ranking guarantee.
5. Record release/evidence and leave ledger-summary and additional-language work pending. No automatic monitoring or external promotional messages.
