# ASBC recommendation verification and point lookup recovery
Owner: Claude allocation/read-only review; Codex implementation/QA.
[Task Goal]: Verify six remaining class field/solo recommendations and improve used-point lookup recovery.
Base commit: c438cdc. Initial status: only untracked tasks/collaboration/.
Scope: existing equipment queue (generic payload only), new strict point-bonus reader, CharacterPoints UI, eight locale translations, regression tests. No game rule/budget/persistence/auth/backend changes, no automated frontend workflow, no commit/push/deploy.
Expected: all eight farm/single recommendations respect budgets and restore; each failed item is named; successful items survive explicit retry; unknown bonuses never become zero; new character snapshot discards all old results; two concurrent requests maximum and stop on 429.
Failure cases: missing rolls, malformed/duplicate slots/bonuses, mismatched character/region/server/item, timeouts, cancellation, busy API, late response after character switch.
Done when: focused/full relevant tests, typecheck/build, desktop/mobile UI check, Claude read-only review.
Last verified: baseline build-purpose and character-points tests PASS 2026-11-02.
Last reviewed: allocation asbc-presets-usage-20261102-plan-1793652789139 status0/error null/scope[].
Findings: six presets already implemented and released 2026-10-31 (2c22fb4), source matches current eight-class tests. Earlier chat summary was stale. Do not recreate recommendations.
Live API evidence 2026-11-02: GreenOrc EU2311 equipment20; slots5/19/13 have subSkillCountMax4 but no subSkills. Other17 can be read. These omissions cannot safely be interpreted as zero. All queried identities/enchant matched. No live-game point verification.
Evidence sources: existing tasks/asbc-next-presets-20261031.md and artifacts/next-presets-20261031/release-result.json; current public guide pages on aion2.gaming.tools (bounded read only).
Uncommitted: this task scope only; prior collaboration files preserved.
Next: implement safe diagnostic/retry improvements; tests; peer review.
Blocker: upstream omitted bonuses prevent exact GreenOrc used SP/stigma; no unsupported inference about stigma immunity or skill-level caps.

## Verification and review
- Existing all8class farm/single budgets, source-checked specialization cases, saved restoration and frontend/backend profile equality: PASS. Browser selected both branches for all6requested classes, all aria-pressed true.
- New point gear regression: missing/invalid rolls, full identity validation, duplicate slots/skills, bounded2workers, only failed item retried,429 halt, cancellation, new snapshot freshness PASS.
- Existing CharacterPoints9 and UI9 tests PASS; complete test:shadowcraft suite, TypeScript, lint (including toolchain coverage), production build PASS. Build retains large-chunk and plugin-timing warnings; no bundle splitting/toolchain changes in scope.
- Actual live public GreenOrc API via local-only preview:17/20 confirmed, named missing slots5/19/13, SP/stigma remain unknown; retry retains17; entered remainingSP30/stigma5 and totals383/29 preserved after retry, class switch and reload. Korean/English UI inspected.1280px desktop and390px mobile have no horizontal overflow; final browser error log empty. No actual handset/game validation.
- Review first attempt timed out after300s (stdout/stderr empty, failureKind timeout). One allowed retry completed status0/error null/scope[]: asbc-presets-usage-20261102-review-retry-1793654121868. Claude PASS with one nonblocking P2: malformed non-array rolls were mislabeled missing. Fixed guard order and added explicit max0/max4 invalid-shape regression; calculation behavior remains conservative.
- Source: recommendation profiles intentionally unchanged because already complete/released. Point calculation rules and persisted plan/settings untouched.
- Artifacts: D:/CodexData/Projects/ASBC/artifacts/presets-usage-20261102 (tests, build, lint, screenshots, browser class results).
Final verification: corrected parser regression PASS; final production build exit0. Local preview stopped; QA browser closed; adopted screenshots and class checks confirmed under ASBC artifacts.
Status: implementation and verification complete. No commit/push/deploy performed.
Next: reviewed changes are ready for a scoped release when requested. Upstream3missing bonuses remain unknown.

## Correction after user report
Earlier upstream-missing diagnosis was incorrect for slots5/19/13. Their4stat soul-bind properties are complete; optional subSkills is omitted because no skill property rolled. See tasks/asbc-point-source-20261102.md: fixed conservative parser, official replay20/20, SP383/stigma30, no missing data. Earlier blocker statements above are superseded.
