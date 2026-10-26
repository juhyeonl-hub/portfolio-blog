# ASBC search discovery — release 2026-10-26
Owner: Codex implementation, verification and release; Claude coordination and exact-commit read-only review.
[Task Goal]: Help Global Steam players discover ASBC through useful English-first tool guides with Korean equivalents.
Scope: 14 static guide pages (two indexes and six topics per language), readable root HTML, metadata/sitemap, app-footer guide links, initial browser-language detection and the Google-issued public Search Console verification tag. No ledger-summary, other pending work, backend, auth, schema, game-rule or additional app-language changes.
Done when: guides and tools work on PC/mobile, Claude exact-commit review is resolved, only scoped changes reach main/remote/Cloudflare Pages, production URLs are checked and Search Console sitemap submission is confirmed or accurately recorded as blocked.
Base commit: 50ebdfaf1e474fce120d28512b12c45297051921
Inputs/expected: buy130000 x100, sell150000, tax10%, registration fee0 => profit500000 at lot sizes25/50/100. Saved ko/en/ja/fi wins; unsupported new-browser language => English. No-JS guides have self-canonicals and reciprocal en/ko/x-default links.
Failure cases: stale labels, broken links/canonical/sitemap, empty initial HTML, invalid locale defaults, unsupported game claims, mobile overflow, API proxy omitted or unrelated source included.
Verification: SEO checks, all44frontend suite commands, TypeScript and production build passed. All15sitemap URLs and internal guide assets returned200 locally without JavaScript. All14guides fit PC1440 and mobile390; trade guide also fits320. English/Korean switches, guide→public builds, guide→Player builds, app footer→guide and actual calculator500000 result/lot comparisons checked. Saved Korean preference survived reload; English restored through UI.
Last verified: 2026-10-26, reviewed source and live production. All15HTML URLs and16assets match the reviewed output; public builds API returns valid JSON. All14guides fit1440/390 viewports (28checks). Anonymous public-build list, guide→Player builds, calculator500000 in all3lot sizes and Korean/English switches passed. Mobile is a browser viewport, not a physical device.
Last reviewed: Claude exact source4affa5081510d900a22cc512345f14062e0d89a2 returned NO_FINDINGS(0), execution status0/signal=null/error=null. Coordination also completed. Subsequent completion record is documentation only; deployed source remains the reviewed source.
Findings: updated budget wording to used/remaining/total and added current public-build apply/edit/save/share/author flows. Fixed guide menu wording to actual Player builds. No unverified probabilities, live hidden-cube positions, guaranteed spawns/profit or confirmed remaining-point claims.
Uncommitted: release source is on main and origin/main. All229non-scope paths from the243-path baseline remain byte-identical. Existing mixed-file content in PROJECT_BRIEF and pending package test entry preserved. Ledger summary, home/globals, other translations and unrelated work excluded.
Next: Google crawling/indexing processing. The sitemap submission and release are complete. Optional individual URL request can be retried later in Search Console after its reCAPTCHA service connection recovers. No automatic monitoring or additional scope started.
Blocker: no release or sitemap blocker. Additional individual indexing request for /guides/ failed with Google reCAPTCHA service connection error; it was not accepted. Inspection still reports not indexed. Sitemap success/discovery does not mean search indexing or ranking.

## Implementation and boundaries
- Six topics: trade calculator, public builds/player lookup, build planner, Daevanion, event timers and map/collections. English and Korean guides render fully without JavaScript and use existing tool routes.
- Root fallback contains readable links. App footer exposes the guide index after mounting. Existing saved language wins over browser preference; unsupported browser language defaults to English.
- Metadata: unique titles/descriptions, self-canonical, reciprocal language links, Open Graph/Twitter and visible-content WebPage/CollectionPage JSON-LD. No invented ratings or game authority.
- Public build guide distinguishes current game character setup from site-author posts, copied planner plans from original posts, and live post links from allocation snapshots. Save important current plans before applying another build.
- Google URL-prefix property was opened in the user's already-signed-in account. Its exact public HTML verification token was copied into root HTML; no credential, permission, DNS or account security settings were changed. Ownership verified in Search Console. Sitemap submitted2026-10-26; Google reports Success and15discovered pages. Representative English index inspection reports not indexed; its optional extra index request failed with a Google reCAPTCHA service connection error.
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

## Production completion — 2026-10-26
- Source4affa5081510d900a22cc512345f14062e0d89a2 was committed to main, pushed normally and deployed to Cloudflare Pages project asbc: https://04a8c246.asbc-4c9.pages.dev. Production https://asbc.app serves the reviewed content. Existing API functions included; no backend deployment.
- The first deploy attempt used the subdomain as a project name and failed before deploying. The actual asbc project was confirmed through the official CLI and deployed successfully. No credentials or security configuration changed.
- Chrome connection was restored by the user after the earlier browser-control interruption. Google Search Console ownership and sitemap submission are now verified from the actual signed-in UI: /sitemap.xml, Success,15pages, last read2026-10-26.
- Representative https://asbc.app/guides/ is not indexed yet. Additional Request indexing failed with Google's reCAPTCHA service connection error. No CAPTCHA bypass, permission changes or claim of accepted indexing request. Sitemap submission remains successful.
- Production PC/mobile: 14English/Korean guide URLs x2viewports, visible headings/language/nooverflow; guide→anonymous Public builds, app footer→guide, guide→Player builds, Korean/English switch. Calculator buy130000 x100 / sell150000 / tax10% / fee0 shows500000 at25x4,50x2,100x1 on PC/mobile. Temporary calculator inputs restored through UI; browser viewport reset. No personal plans or public posts modified.
- UI evidence: production-browser-guides.json, production-browser-flows.json, production-mobile-english-guides.png, production-mobile-korean-guides.png, production-mobile-calculator.png, production-pc-player-builds.png. Search registration: search-console-result.json, google-sitemap-success.png, google-index-request-error.png.
- Source/build verification: tests.log, typecheck.log, build.log, production-http.json, claude-review-result.json, claude-review-execution.json, main-merge-verification.json. Documentation completion is recorded separately from the deployed source.
