# Complete Steam locale support — 2026-10-28

Owner: Codex, with Claude coordination and read-only reviews.

[Task Goal]: Remove Korean leakage in English tooltips, add the five missing Steam languages, verify PC/mobile, and deploy only this scope. The user explicitly authorized immediate deployment and sending 3,650 public UI strings to Google Translate. Account, character and user-written content were excluded from that transfer.

Status: COMPLETE. Scoped changes committed and pushed to main; production backend and website deployed and verified.
Base: f5f616bf54b332034bc9629671c1188ab337d739.
Implementation: c0f7eaf0b0845c84d933e5f36d5fa81f397f1189.
Final copy corrections / frontend release: 54651d46f14f7d9b180de0a8e14ffe0b7c49ef13.
Last verified: 2026-10-28, actual https://asbc.app/ browser checks and public API health.
Next: no required work remains for this release.
Blocker: none.

## Delivered scope
- Added fr/de/es/pt-BR/ru; retained ko/en/ja/fi. Nine visible choices, browser-locale detection, lazy-loaded UI bundles, persistence and backend account-locale validation.
- Complete five-language coverage for 2,689 UI entries, 497 specialization templates and 280 skill descriptions. Calculator/ranker text, dates, privacy text and navigation included.
- Added 36 combo-skill aliases matched to official client names and the same specialization IDs; English references no longer leak Korean. Names without official localized evidence keep the verified English name.
- New descriptions explicitly say they translate the official English source. Unknown values remain `?`. Translation placeholders, numeric values and skill-reference tokens were checked rather than invented.
- Fixed mobile translated navigation/footer/button overflow and initial Korean flash. Locale switches preserve mounted editor state; failed initial language loads offer recovery.
- Actual production reading identified eleven text fields needing clearer wording: five skill-search labels, five point-allocation labels, and French unavailable-balance guidance. These text-only corrections were independently tested and deployed after the reviews.

## Verification actually run
- Frontend typecheck, lint, all 45 Shadowcraft test scripts, production build and SEO checks: PASS. Final eleven-field copy follow-up: localization tests, production build and SEO checks PASS.
- Locale checks cover exact UI parameters, 896 catalog specializations, 4,296 board-node names across eight non-Korean locales, 1,693 official EN/JA specialization IDs, 299 official skill names and 280 descriptions in five added languages.
- Backend `mvn -q -DreuseForks=false test`: 79 passed, zero failures/errors/skips. Includes controller persistence for all nine locales. Tested JAR packaged successfully.
- Default shared-H2 test execution initially failed on existing PublicBuildControllerTest FK cleanup. Separate JVMs passed; no unrelated production code was changed for that test issue.
- Local preview: PC 1440 and mobile 360/390, all five added languages, 15 combinations with document width equal to client width. Search input survives language switches. Five privacy translations retain eleven headings/contact and reload with the selected language.
- Calculator reference across five languages: material cost 10,908, sale price 13,333, profit 1,091 and break-even 12,120 at 10% tax. Values stayed unchanged across locales.
- Final production: five languages at PC 1440 and mobile 390 (ten combinations), localized search labels, preserved search text, readable translated skill content, no Korean in tested tooltips, and no horizontal page overflow. English PC/mobile tooltip shows Threatening Blow and unknown damage as `?-?`. Russian persists after reload. Browser error log empty.
- Mobile verification used browser viewport emulation, not a physical handset. No new authenticated two-device UI run or native-speaker fluency certification is claimed. Account locale acceptance/persistence was checked by frontend and backend tests.
- Production language restored to the original Korean setting; test search cleared. No character allocations, public builds, collection records or account content were edited by browser verification.

## Collaboration
- Claude coordination PASS, run asbc-steam-locales-coordinate-20261028-1793219627812.
- Implementation relay timed out after 600 seconds with seven partial files. Codex inspected them and completed the assigned integration; timeout was not counted as a passing review.
- Full read-only review asbc-steam-locales-review-20261028-1793221874527: PASS, exit0, status0, error null, scope[].
- Follow-up read-only review asbc-steam-locales-final-review-20261028-1793222563751: PASS, exit0, status0, error null, scope[]. Optional punctuation/wrap refinements and the final eleven text fields were independently checked after review.

## Production release and preservation
- DB dump created and pg_restore listing verified before release; no migration or retention deletion.
- Backend JAR SHA256: 1d088c198f8f6fe593eb465153d65a3a6094fc1c96c455a00e6f817dba9a2a1c. Previous JAR retained for rollback.
- An attempted sudo restart stopped at missing sudo authorization before service changes. The documented existing deployment procedure was then used: verify service owner/command and Restart=always, atomically install the tested JAR, gracefully terminate its owned process, and verify the restarted service. No permission, login or security configuration was changed.
- Local and public API health returned status ok. Backend release contains c0f7eaf; subsequent changes are frontend text only.
- Final Cloudflare Pages deployment: https://4155df34.asbc-4c9.pages.dev (production https://asbc.app/), source 54651d4. Live asset asbc-BAtEe3i5.js and locale-C75IDd9G.css confirmed.
- Primary main had 302 pre-existing pending paths. Their status list remains identical. 300 paths remain byte-identical to the baseline; unrelated PROJECT_BRIEF bytes and UI-dictionary fields were preserved through append/per-field merging. Reversing our UI delta reproduces the original dictionary. Index remains empty after integration.
- Translation artifacts, reviews, test logs, preservation assertions and release reports: D:/CodexData/Projects/ASBC/artifacts/steam-locales-20261028.
- Production evidence: production-browser-validation.json, production-english-tooltip-pc.jpg, production-english-tooltip-mobile.jpg, production-russian-tooltip-mobile.jpg.
