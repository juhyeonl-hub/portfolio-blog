# Skill-by-skill specialization guide — 2026-10-29
Status: VERIFIED FOR RELEASE. Owner: Codex; Claude readonly coordination and final review.
[Task Goal]: Show which specialization effects to choose for every skill in the point-budget recommendation, one skill per row.
Base: c113037d8b5a0b53b0e2f685285a7076238ecd1a.
Scope: point-budget.tsx, a presentational allocation component/CSS, UI translations, a focused rendering test, task/brief. Existing recommendation rules, catalogs, save/apply code remain unchanged.
Expected: displayed selected IDs equal candidate.specs in catalog order; final levels include gear/daevanion; passive, automatic stigma, locked slots and empty choices are distinct; next effect/slot levels come from the catalog. Entire list readable without nested scrolling at PC/mobile widths. Existing apply carries the displayed choices; point changes clear stale preview.
Failures to cover: zero slots/points, level thresholds, automatic effects, missing choices, translated labels/overflow, stale preview, apply/persistence mismatch.
Done when: local PC/mobile Korean/English plus all locale smoke, focused tests/build, Claude review and scoped deployment with production verification.
Coordination: relay1 PASS finished 2026-10-29T16:08:04.162Z, status0/errornull/scope[].
Baseline: production recommendation contains 22 skill rows and no specialization text. Screenshot and DOM evidence retained. Baseline QA class restored.
Last verified: nine CLI checks and18 local browser locale/viewport cases. Last reviewed: Claude relay3 PASS.
Uncommitted: scoped implementation complete. Primary302 pending paths preserved; overlap only dictionary/brief.
Next: scoped release and production verification. Blocker: none.

First localization check caught two missing scaffolding keys (gear/daevanion bonus and numbered specialization). Added all8 locales; repeat checks/build required. No product calculation failure.

Local verification: live GreenOrc EU/Ludra Lv45 imported through public character UI on isolated localhost. Nine active skill selections exactly match preview after mobile apply and desktop reload. Desktop apply also matches. Point edit clears stale preview; Lv10 zero-budget case shows no selectable specs. Ascension-confirmed QA case shows five automatic stigma effects. Korean/English/Japanese/Finnish/French/German/Spanish/Portuguese/Russian at1440x1000 and360x800:18 PASS, no horizontal overflow, nested scrolling, Korean leakage outside Korean, unresolved placeholders or console errors. Ascension QA flag restored.
Checks: rendering regression, localization, specialization localization, budget, all classes, navigation, TypeScript, production build and SEO PASS. Current asset /assets/asbc-CwkwBOdz.js. Existing chunk-size warning only. Local public armory POST initially blocked by development proxy/CORS; corrected only development proxy and successfully imported GreenOrc. Production security/source untouched.

Claude final acceptance: relay2 timed out240s (status143, stdout/stderr empty). One allowed retry used bounded44,945-byte packet; relay3 PASS finished 2026-10-29T16:29:56.238Z; process exit0/status0/errornull/scope[]. Reviewer inspected code/test evidence; did not independently run browser/CLI checks. Source hashes remained unchanged after review. Non-blocking followup confirmed both reused passive/automatic-effect strings have all8 locale values; evidence review-followup.json.
