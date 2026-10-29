# Five-language public build journey — 2026-10-29

[Task Goal]: Verify production find/apply/edit/save/share in fr/de/es/pt-BR/ru on desktop/mobile, improve confusing translations or controls, and deploy only scoped changes. User explicitly authorizes immediate deployment.
Owner: Codex; Claude allocated the work and performed read-only reviews.
Base: 197abeb2cf303d7e33c9250297e849f6bcf84283.

## Changes
- Corrected 27 UI translation values across 11 keys: game class terminology, explicit current-plan replacement/undo/save-copy guidance, unverified imported point totals, consistent build-search labels, shorter French save/download actions.
- Corrected 9 specialization translation values: duplicated on-hit wording and malformed stun sentences. Source strings, numeric values and placeholders are unchanged. This is text correction only, with no gameplay/calculation/catalog changes.
- Shared-reader footer now uses the existing wrapping rule (Russian previously overflowed a 360px viewport to 375px).
- At <=760px, secondary build navigation now flows normally. Previously its sticky Save button covered a skill increase button: DOM hit test at x210/y400 returned Save and the click navigated to the library. Desktop sticky navigation and global timers are unchanged.

## Verification completed before release
- Original production FR/DE PC journeys passed search/filter -> apply -> skill edit -> named copy -> reload/reopen -> share; ES/PT-BR/RU shared previews inspected.
- Updated local journeys passed FR360, DE1440, ES360, PT-BR1440, RU360. Vicious Strike base8 ->9, final10 ->11; skill requirement195 ->199, Daevanion remains142. Browser clipboard matches generated URL; same payload across locales; reopened copy retains edit. No clipped main controls or horizontal overflow.
- Typecheck, all45 frontend test scripts, build and SEO PASS (checks.log). Localization/specialization tests rerun from frontend/shadowcraft PASS; final build and SEO PASS after CSS fix. One wrong-directory test invocation failed ENOENT before correction; preserved separately in wrong-cwd-check.log.
- Scope assertion: exactly36 locale values, only fr/de/es/pt-BR/ru; source keys, other locales, numeric tokens and placeholders unchanged (translation-scope.json).
- Claude read-only reviews APPROVE: final translated copy/footer (run1793232724133), final mobile property (run1793233114456). Reviewers made no source edits. Four bounded relays including allocation used; no further relay requested.

## Preservation and release
- User GreenOrc plan and8 original named copies are untouched. Main-domain reader checks are read-only; initial language restored to Korean. Private QA copies use an isolated, signed-out origin of the exact deployed production build. No public posts created or changed.
- Primary main has302 pre-existing pending paths, snapshotted with hashes in release-baseline.json. Integration will preserve all; mixed UI dictionary changes merge by field and PROJECT_BRIEF by append.
- Status: verified source ready for scoped main commit/push/deployment. Final production5-language x2viewport matrix pending deployment.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/five-language-journey-20261029.
- Mobile means360x800 browser viewport emulation; no physical phone claim. Private local-library save and anonymous share covered; authenticated publishing/account synchronization is outside this task.

## Production verification and final visual follow-up
- Released774aba7 to https://8ceba78a.asbc-4c9.pages.dev and asbc.app (asbc-ChLnZKhV.js). All10 production journeys passed: five locales at1440x900 and360x800, search/filter/apply/edit/local-save/reload/reopen/copy/anonymous-share. Shared points199/0/142/0 and Vicious Strike final11 in every case. Browser clipboard equals generated URL; no new console warnings/errors.
- Original main-domain GreenOrc restored read-only, original8namedcopies remain and no QA copies were added there; locale restoredko.
- Final visual inspection additionally found long mobile column headings overlapping (FR base width58/scroll77, gear width36/scroll72). Added only min-width:0/overflow-wrap:anywhere/hyphens:auto to mobile skill header spans. All5locales now have scrollWidth==clientWidth in all columns;1440px desktop retains sticky navigation and normal wrapping. Build/SEO pass again.
- This additional small text-layout rule was independently reviewed by Codex as low risk. The four-relay cap is reached; Claude approvals above cover the earlier copy/footer/navigation changes, not this subsequent wrapping rule. No persistence, game calculations, authentication or deployment configuration changed.
- Final wrapping-rule production deployment and spot verification pending; evidence header-build.log/local-header-checks.json.

## Completed
- Final source5a4e12d is on main/origin; Pages https://7defd6a5.asbc-4c9.pages.dev serves asbc-CjmOW5Bn.js. All10 complete journeys rerun on this final deployment origin, with generated links opened anonymously at asbc.app, PASS. Final5-language mobile header bounds PASS; desktop still sticky/normal-wrap. No new browser console warnings/errors during the matrix.
- Existing main-domain library text exactly matches the pre-final baseline:8copies, no QA copies; GreenOrc and Korean locale confirmed. Main302pending paths preserved through both code integrations. QA browser tabs closed, viewport restored;23 browser evidence files adopted into ASBC artifacts and own HomeSphere temporary evidence folder removed after hash verification.
- Verification: complete for requested browser workflows (1440x900 PC,360x800 mobile emulation). Evidence production-journeys-final.json, production-header-checks.json, preservation-final.json, final screenshots, integration.json and followup/integration.json.
- Last reviewed: Claude approvals for copy/footer and navigation; final low-risk header wrapping independently checked by Codex, as documented above.
- Uncommitted product changes: none. Next: none in this scope. Blocker: none.
