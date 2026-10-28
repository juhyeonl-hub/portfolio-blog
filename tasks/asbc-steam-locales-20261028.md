# Complete Steam locale support — 2026-10-28
Owner:Codex; Claude coordination and review.
[Task Goal]: Remove Korean leakage in English tooltips and implement fr/de/es/pt-BR/ru across the ASBC application, verify PC/mobile, release scoped changes immediately as explicitly requested.
Base:f5f616bf54b332034bc9629671c1188ab337d739
Scope:localization plumbing/data/numeric labels, account locale validation, tests and truthful support copy. Preserve gameplay values and all unrelated main edits. Existing ko/en/ja/fi retained.
Expected:all9language choices persist/reload/sync; new5 render translated navigation, tools and skill descriptions with unchanged placeholders/numbers; English references contain no leaked Korean; en-US remains fallback only for unknown official names with honest provenance.
Failure cases:selector-only support, unchanged English bulk strings, invented official translations/game data, stale locale bundle race, unsupported backend preference, missing placeholders/number drift, overflow, unrelated changes mixed.
Done when:complete supported-message coverage, relevant tests/build/backend checks, PC/mobile hands-on, Claude review and scoped commit/push/deploy verified.
Verification:pending. Last verified:baseline clean and remote main f5f616b.
Last reviewed:pending allocation.
Findings:2688UIkeys,497specialization templates plus scoped ranker/craft dictionaries, official names/descriptions and locale-dependent formatters. Steam official store confirms5missinglanguages.
Uncommitted:task/coordination only.
Next:Claude allocation, source inventory and translation pipeline.
Blocker:none.

Coordination execution PASS(scope[],exit0). Implementation relay timed out after600s:7plumbingfiles changed, no tests/review claimed. Codex inspected and completed missing glue/tests per integration assignment. User explicitly approved sending3650publicstrings toGoogle Translate; excludes account/character/usercontent.36extra combo skill names matched to official client names and same specializationIDs; provenance in ASBC/artifacts/steam-locales-20261028/combo-skill-provenance.json.

Integration complete: 2689 UI keys, 497 specialization templates, 280 translated skill descriptions, 36 verified combo aliases. All 5 new languages have complete coverage. UI dictionaries stay per-locale chunks; existing ko/en/ja/fi and all gameplay catalogs preserved. Skill names without official localized evidence remain canonical English. New skill descriptions are labeled translations of official English text; unresolved values remain ?. Numeric drift and merged translation rows found during draft audit were corrected, not accepted.
Validation so far: typecheck PASS; focused locale/account backend test PASS; all896 specialization templates preserve numbers in8non-Korean locales;4296node names resolve in8non-Korean locales; full frontend suite/build running. Backend default full suite found pre-existing shared H2 FK cleanup conflict in PublicBuildControllerTest; rerun with reuseForks=false in progress. No unrelated production code changed for this test issue. PC/mobile hands-on and final review pending.
Primary main baseline saved:302pending paths,emptyindex,f5f616b. Artifacts: D:/CodexData/Projects/ASBC/artifacts/steam-locales-20261028. External translation consent: explicit user approval in this chat. Full privacy originals retained;5translations stored separately. No deployment yet.

## Final validation and responsive follow-up (2026-10-28)
- Frontend typecheck, lint, all 45 Shadowcraft test scripts, production build, and SEO checks passed before the final visual fixes. Final targeted changes are being revalidated.
- Backend: default shared-H2 suite had unrelated FK cleanup errors; isolated JVM run `mvn -q -DreuseForks=false test` passed 79 tests, zero errors/failures/skips. Tested JAR packaged successfully.
- Claude read-only review run asbc-steam-locales-review-20261028-1793221874527: process exit 0; execution status 0/error null/scope []; PASS, no deployment blockers. Review explicitly did not certify native-language fluency.
- Direct local-preview PC1440/mobile390: all five languages maintain 10,908 cost / 13,333 selling price in the material example; language survives refresh. English Vicious Strike tooltip shows Threatening Blow and no Korean; all five translated skill tooltips render with the translated-description label.
- Browser checks found mobile translated navigation/footer/button overflow and first-load Korean flash. Added a dedicated locale-layout.css, mounted loading surface with retry/language recovery, retained previous loaded messages during switches. Two Russian specialization phrases corrected to distinguish increased MP recovery from restoring a percentage, and HP absorption from generic restoration.
- Final follow-up read-only review and 360/390px recheck pending. Production/user character/account state has not been edited during local validation.

## Release candidate verified
- Final typecheck, lint, all 45 frontend scripts, production build and SEO checks: PASS. Follow-up navigation-label and segmented-button wrap changes: localization coverage test, build and SEO PASS.
- Claude final read-only follow-up `asbc-steam-locales-final-review-20261028-1793222563751`: exit0, status0/error null/scope[], PASS. Afterwards applied its optional nav-label punctuation correction and a two-rule mobile segmented-wrap correction; independently rebuilt and browser verified. No claim of native-language certification.
- Latest assets: asbc-DIEPMe2b.js and locale-C75IDd9G.css. PC1440 and mobile360/390, all5locales: document.scrollWidth equals document.clientWidth in all15combinations. Search input Vicious preserved through all switches.
- All5privacy pages: translated11headings, contact preserved, no Korean except the unchanged brand name, language survives reload. Calculator fixture cost10,908 / sale13,333 / profit1,091 / break-even12,120, 10%tax checked across all5locales.
- No physical handset or new authenticated two-device session was claimed; mobile tests used browser viewport emulation. Account locale persistence covered by frontend validation and real backend controller round-trip tests for all9locales.
- Primary repository302pendingpaths match baseline. Only PROJECT_BRIEF.md and UI dictionary overlap this release; byte backups made, task changes will merge by append/per-field semantics. Remaining300files must remain byte-identical.
- Public-source transfer authorization honored. New languages use clearly labeled translations of official English descriptions; verified English skill names remain where official localized names were unavailable. Unknown values remain unknown.
- DB backup verified: /home/juhyeonl/portfolio-blog-ops/backups/portfolio_blog_steam-locales_20261028T212408Z.dump. No retention deletion or data migration.
- User authorized immediate scoped commit/push/deploy; preparing release. Final deployment evidence is stored in D:/CodexData/Projects/ASBC/artifacts/steam-locales-20261028.
