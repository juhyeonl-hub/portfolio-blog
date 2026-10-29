# Five-language trade calculator and map — 2026-10-29
[Task Goal]: Exercise production trade calculator and map/collection records in fr/de/es/pt-BR/ru on PC/mobile; fix confusing translation/input behavior; immediately deploy only scoped changes (explicit user authorization).
Owner: Codex implementation/browser verification; Claude read-only allocation completed, final review PASS.
Base: 23f99ac8d0813e63575d0b68295cb3dea225085f. Primary main has 302 unrelated pending paths, captured by SHA-256 in release-baseline.json.

## Observed problems and changes
- All five production locales rejected their own displayed thousands separators (130.000, French narrow NBSP, Russian NBSP) and decimal-comma rates (7,5). Whole Kinah/count parsing now accepts complete, consistently grouped integers; percentage parsing accepts one dot or comma, at most two decimals. Mixed separators, fractions in whole amounts, exponents and out-of-range inputs remain rejected. No floating-point money arithmetic.
- A custom crafting profit target reset to 10% on reload while materials/tax survived. Preserve an independent craftProfitRate in the existing browser-local calculator draft; old drafts default to 10%, resale profitRate stays separate. No new account storage/API/auth behavior.
- Five-language craft copy now states finished-item quantity, batch scaling, net profit relative to cost, minimum price without loss, and conditional net profit clearly. Existing ko/en/ja/fi copy and numeric placeholders preserved.
- Map counts previously said Found although they represent user-checked potential locations. Now explicitly checked/marked. Improved collection heading and hidden-cube icon wording, preserving the warning that candidates do not guarantee current spawn.

## Actual verification
- Production before: 7defd6a5.asbc-4c9.pages.dev (exact current deployment, signed out), five locales × 1440/360 px. Calculator separator failures reproduced in all 10 cases. Map region/search/zoom/cube/check/hide/reload passed all 10.
- Local revised build: five locales × 1440/360 px, both pages (20 successful cases), screenshots/JSON under artifacts/five-language-trade-map-20261029. Mobile means browser viewport emulation, not a physical phone.
- Calculator: 2×5254+400=10908; tax10%, minimum without loss12120, 10% target13333. Locale-formatted130000 accepted; wood/sandpaper prices and material/output counts changed; tax/target7,5 accepted; ×2/undo correct; tax100% gives no achievable price; malformed13,00 rejected. Reload preserved custom target: cost16362/output3/tax7.5%/profit7.5% => price6339, minimum5897, profit1228.
- Map: Altgard→Verteron, Cantas search5options, zoom changes viewBox, localized hidden-cube search, check1/1440, hide removes one (1439), reload retains check, uncheck restores. One Russian desktop cleanup click did not change the checkbox; inspected state, retry and separate desktop/mobile reruns passed. No storage errors. No map persistence code changed.
- No horizontal page overflow or clipped main controls at either viewport in the checked flows. Canonical game/place names and brand remain source names, not invented translations.
- npm run typecheck:shadowcraft PASS; npm run test:shadowcraft (45 scripts) PASS. After adding craft target persistence: typecheck + trade-calculator/trade-workbench/trade-sync PASS. Final build:asbc PASS; test:seo PASS. Existing large-chunk/plugin timing warnings remain.
- All mutable browser tests used isolated production alias or localhost. Main-origin user's calculator/map/account data untouched. Test checks were restored.

## Release status
Claude final read-only review PASS (run1793252044205, process exit0, execution finished/status0/errornull/scope[]). Commit/push/deploy next. User has explicitly authorized immediate scoped deployment; no further permission question needed.
Planned files: trade-calculator.ts, tests/trade-calculator.mjs, app/trade-calculator.tsx, craft-sale-text.ts, ui-translations.json, this task, PROJECT_BRIEF.md. Primary overlap only PROJECT_BRIEF.md and ui-translations.json; integrate task append and exact locale fields, preserve other edits.

## Review follow-up
Claude review run1793251363434 completed status0/errornull/scope[] with one blocking finding: new draft field made pre-existing ledger records unreadable. Added a legacy fixture missing craftProfitRate; reproduced null before fix. Ledger validation now supplies only this new field default before validation, retaining purchases/sales and strict checks. Also clarified DE/ES checked-vs-selected map controls/progress, and replaced ambiguous candidate selector copy with possible-location wording in FR/ES/PT/RU. Follow-up typecheck, full45 test scripts, build:asbc and SEO all PASS (review-fix-validation.log). Scope audit confirms 22 map fields only in requested5 locales, 62 crafting copy keys preserve other4 locales and every placeholder. Final narrow review PASS.

Final local map10cases passed after copy follow-up (local-map-final.json); DE mobile calculator repeated after final build. Open preview initially retained an old language after assets were rebuilt; reloading the fresh build resolved it before these checks. No production conclusion based on the stale preview.
