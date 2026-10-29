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
