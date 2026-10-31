# Remaining class presets and dependency follow-up — 2026-10-31
Owner: Claude allocation/read-only review; Codex implementation and browser QA.
Task Goal: continue previous release by verifying and adding the remaining six classes' solo/field directions, and resolving compatible dependency security updates.
Base commit: aeb72112f1903c2f51f498cb6b94b1c6fab34440.
Scope: existing class-profiles/PvE direction UI, skill/spec/stigma priorities, concise localized field guidance, evidence and tests. Dependency changes only where official patched versions and compatibility checks support them; no forced major runtime migration without full validation.
Expected: all supported class choices use observed public guide evidence and current catalog IDs; no invented optimal/DPS claims. Changed direction never changes manual allocations until Apply; budgets/unlocks respected; undo/save/reload preserved. Unsupported evidence remains explicitly unavailable.
Done when: bounded evidence collection, implementation, PC/mobile responsive verification and Claude review; scoped source commit/push/deploy under standing user instruction. Preserve unrelated primary302 files and current worktree untracked files.
Verification: frontend suite, TypeScript, backend tests, build/SEO and direct PC/mobile flows passed; ESLint does not cover TS/TSX.
Last verified: current local source and responsive browser flows; production release pending.
Last reviewed: Claude PASS asbc-next-presets-review-20261031-1793475788707; no P0/P1/P2 blockers.
Findings: prior runtime Spring6.2.19 advisories affect unused XsltView/SSE fragment features; dev minimatch6moderate; production npm0. Recheck vendor evidence before any claim.
Uncommitted: task/collaboration only initially.
Next: Claude allocation, source evidence, baseline hashes, targeted implementation/tests.
Blocker: none.
Authorization: user said 다음 진행 after deployed remaining feedback; standing reviewed scoped deployment instruction persists. No new scheduler, user-content publication, credential changes or unrelated edits.

## Implementation and dependency review
- Claude allocation completed successfully: run asbc-next-presets-plan-20261031-1793474633566 (status0, empty write scope). Codex owns implementation; Claude will review read-only.
- All six remaining guide pages inspected through visible farm/single tabs, using a bounded selection of differences rather than copying guide internals. URLs and checked skill IDs: artifacts/next-presets-20261031/preset-evidence.json.
- Backend mirror decision: ShadowcraftService.profile serves class-profiles.json; mirror it with the frontend to prevent stale public data. No backend logic/dependency changes.
- Found Assassin hardcoded specializations and learned/stigma steps bypassing profile overrides; profile overrides now take precedence only when present. Original group/leveling/PvP fallback remains.
- Security recheck 2026-10-31: npm audit reports 6 moderate dev-only findings; production dependency findings 0. GHSA-g3hv-75wg-m249 (<11.0.1) is globparts amplification with optimizationLevel>=2. Latest ESLint10.14.0 still depends on minimatch^10.2.6; v3 patch line ends at3.1.5. No drop-in compatible fix found; don't force a breaking minimatch11 override into ESLint9.
- Spring CVE-2026-47884/47890: current6.2.19 is in affected version ranges; fixed6.2.20 is Enterprise-only,7.0.9 OSS requires a major migration. No XsltView, SSE/view-fragments APIs found in backend/src/main. The current request paths do not use the described vulnerable features. This is exposure assessment, NOT a dependency fix or claim of complete security.
- References: https://github.com/advisories/GHSA-g3hv-75wg-m249 ; https://spring.io/security/cve-2026-47884/ ; https://spring.io/security/cve-2026-47890/ . Dependency migration remains a separate compatibility task; manifests unchanged.

## Verification
- Full frontend test suite completed exit0 (exec session71726), including all eight classes and zero/low/endgame budgets; build-purpose targeted suite also exit0. Types, frontend build, SEO, backend Maven tests and npm production audit passed; changed-file ESLint exited0 but skipped TS/TSX because the existing config only covers JS/JSX; logs in artifacts/next-presets-20261031.
- Direct browser QA at isolated localhost:4226: all six new classes, both farm/single branches on 1440x900 PC and 390x844 mobile. At90SP/10stigma/104crystals, farm/single allocations differ; changing direction alone preserves current learned levels and selected specializations. Browser evidence: browser-qa.json.
- Assassin PC/mobile apply, decrease a skill, name/save, reload, alter, restore from saved preview: prior edited levels and preset retained. Two owned QA library entries deleted. Production user plan was never changed.
- Found and fixed an old Assassin hint recommending an unequipped stigma. The named Fang hint now requires that equipped stigma (legacy safe hint unchanged). Rechecked via visible UI after dev restart; generic activity guidance shown instead.
- Korean and English responsive controls visually checked. No browser console errors. Desktop scrollWidth1425<=1440 and mobile375<=390. New guide strings and placeholders covered in all9locale tests.
- Existing English Ariel remaining-points accessibility label is Korean; it predates this scope and remains a separate localization follow-up.
- Backend/frontend profile JSON is exactly mirrored and unit checked. No dependency manifests, login, account data or storage protocol changed.
- Claude review: pending final read-only review. Deployment not yet performed; release artifacts will record exact commit, hashes and production checks.

## Release gate
- Claude read-only review asbc-next-presets-review-20261031-1793475788707: PASS, completed status0, empty write scope; response inspected before release. Minor single-enemy wording observation accepted: the guide describes the chosen activity, without claiming an effect is exclusive to one target.
- Final TypeScript and targeted budget/guide suite exit0 after UI hint correction. Backend tests: {'tests': 115, 'failures': 0, 'errors': 0, 'skipped': 0}.
- Correction to the review request: ESLint exit0 had ignored-file warnings, so it is NOT counted as applied TS/TSX lint. Existing lint config covers JS/JSX only; TypeScript compiler and functional tests performed the checks here. No lint tooling/config changed in this task.
- Structural comparison with HEAD: only pvePresets/pvePresetSource added to six profiles; original group/leveling/PvP and prior Templar/Ranger profiles unchanged.
- English Apply-button text and Ariel remaining accessibility label are older translation follow-ups outside this preset scope.
- Reviewed source files fixed by scope-hashes; release pipeline will build only committed source and preserve existing302/509files.
