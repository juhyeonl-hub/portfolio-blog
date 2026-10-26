# English beginner journey audit — 2026-10-26
Owner: Codex. Claude 불가로 Codex 임시 조율: existing usage_limit until Oct26 14:00 Helsinki; no retry. People-builds cross-review hold preserved.
[Task Goal]: English first visit → discovery/filtering/requirements → apply/edit/save/share at desktop 1440 and mobile 390. Improve evidenced beginner friction; preserve all existing work.

## Outcome
Implemented 8 scoped frontend files. No commit, stage, push or deployment. No auth, API, storage schema, game rules or calculation changes.
- Home: direct community-build entry with anonymous browsing/editing explanation.
- Listing: browse/filter/results before publish sign-in; title-language guidance; short original-author description; grammatical result count; consistent Like label.
- Shared/public preview: visible spent-point requirements separated from author's total setting; budget/ascension warnings; Apply and overwrite/undo explanation before long skills. Snapshot sharing explains edits need a new link.
- Library: remove unrelated character/point editor on the saved-build route; Continue editing skills; correct PvP label in saved rows and preview.
- Skill image alt text localized; conditional skill/Daevanion guidance and node accessibility labels translated. Original user-written posts remain verbatim.

## Actual browser evidence
Baseline: production deployment alias https://d53b10a4.asbc-4c9.pages.dev/ (production source fa3eddd9aa2a19787873f666db3f1786e8cc6605). Separate origin avoids overwriting user's asbc.app session, GreenOrc plan or saved library. User tab45 remained untouched.
Fix validation: isolated source at localhost:5196 with read-only production API proxy; mutation endpoints blocked. PC viewport1440 and mobile390 (DOM content widths1425/375; scroll widths equal). Mobile checks are browser viewport tests, not physical-device tests.
- English home → Find a community build → title/class/sort search. Ranger + Test and Templar + Most liked each returned one matching post. Empty query result showed Results:0 with recovery instructions; Reset filters restored Results:2. Controlled503 failure and reset/recovery passed.
- Templar public post f1337ebe-18a7-43da-bfa3-d869abb3c498: visible requirements skill195, stigma0, Daevanion142, Azphel0; author's totals383/29/316/0 are labelled separately.
- Mobile: apply original base8, edit Vicious Strike to6, save [QA English] Mobile, reload/reopen → base6 + Daevanion2 = final8; skill189 and Daevanion142. Generated link opened anonymously with matching values.
- PC: apply original base8, edit to7, save [QA English] Desktop final, reload/reopen → base7 + Daevanion2 = final9; skill191 and Daevanion142. Share copy feedback succeeded; mobile anonymous reader showed the same allocation.
- Saved PvP mode rendered PvP, not Offensive. Continue editing skills returned to the editable plan. No horizontal overflow in audited screens; final PC/mobile error logs empty.
- Final conditional-label check: English node labels, selected-node explanation, all-board recommended/total summary visible after local server refresh.
- Native OS clipboard cross-application paste was not tested this turn. Link generation, copy feedback and opening the generated href were tested. No public posts, likes or account changes were made.

## Automated checks
Isolated source: typecheck; public-builds; build-share (8 classes x3 gear); build-library; plan-memory; localization (56 screens); navigation; home-favorites passed. Production build passed; pre-existing chunk-size/plugin-time warnings only.
Integrated working tree: typecheck, public-builds, build-library, navigation, people, growth-guide and localization (59 screens) passed. Initial guessed people-builds.mjs test name did not exist; actual tests/people.mjs passed. Final localization recheck passed after dynamic labels.
No new tests duplicating presentation implementation added. Existing persistence/validation regressions reused.

## Preservation and next action
Original baseline241 files:236 unrelated pending files retain exact hashes. Three mixed TSX files preserve original changes via reversible scoped replacements; dictionary preserves every existing key/value; PROJECT_BRIEF preserves its exact original prefix. People-builds files/API remain unchanged, review pending. HEAD c2d017938a169fcd981a5ce4dd580734be24a63e unchanged.
Evidence and scoped patch: D:/CodexData/Projects/ASBC/artifacts/english-journey-20261026 (pc-requirements.png, mobile-requirements.png, mobile-library.png, pc-search.png, english-journey.patch, baseline.json, integration-preservation.json, build-final.log).
Limit: current public metadata has no explicit PvE/leveling or author-language taxonomy, so existing class/title/sort filters were checked; no inferred filters added.
Last reviewed: Codex self-review complete; Claude cross-review not performed (usage limit). No deployment requested this turn. Keep people-builds pending review.
Next: user review of these UX changes; any later release must isolate this patch from other pending work. Blocker: none for implementation.

## Explicit scoped release authorization — 2026-10-26
User requested only the verified English discovery/apply/edit/save/share UX changes committed to main, pushed and deployed without Claude cross-review. Waived for this scope, not passed. People-builds remains pending cross-review and is excluded. Claude remains under the recorded usage limit; Codex temporary coordination continues without retry. No backend, auth, database or persistence-format changes.
Release inputs: the eight verified files in the isolated source, plus this task record and only its brief section. Expected: origin/main and deployed assets match selected source, English PC/mobile browsing/apply/save/share works, all unrelated working bytes unchanged. Abort on source mismatch or failed validation.

## Production release completed — 2026-10-26
- User's explicit release authorization applies only to this English journey scope. Claude cross-review waived, not claimed as passed. People-builds remains review pending and excluded.
- Source commit 35efa907455bbfacb66d50ce1324e906fa181a3f pushed to origin/main. Cloudflare Pages https://88e1e136.asbc-4c9.pages.dev deployed; https://asbc.app HTML and eight changed JS/CSS/locale assets byte-match the verified build. All2145 tracked frontend paths matched the selected isolated source. No backend restart, API deployment, migration, authentication or storage-schema change.
- Release candidate typecheck, public-builds, build-share, build-library, navigation and localization (56 screens) passed. Exact-source production build passed with existing chunk-size/plugin-time warnings only.
- Deployed PC1440: English home → community entry → Templar/Most liked returns Results:1. Public preview shows required195/0/142/0 separately from author's383/29/316/0. Apply appears above skills; edit base8→7, named save/reload preview retains base7+2=final9 and191 skill points. Copy feedback confirmed.
- Deployed mobile390: anonymous PC link opens with exact191/142 allocation; apply and edit base7→6, named save/reload retains base6+2=final8 and189/142 points. Mobile-created link opens on PC with the same values. Both viewports have matching scroll/content widths (1425/375) and no console errors.
- Browser acceptance used the production deployment alias after custom-domain asset equality checks, so the existing signed-in asbc.app tab, GreenOrc plan and account settings remained untouched. Test saves are anonymous and local to the new deployment origin. Public test post title/revision unchanged. Native OS clipboard paste was not part of this verification; copy feedback and generated-link opening were checked.
- Preserved all 246 captured working-file hashes through source commit, push and deployment; final documentation changes only this task record and its brief section. Ordinary index remains empty. No unrelated files were stashed, reset, checked out or committed.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/english-journey-20261026/release/{selected.diff,deployment.log,production-assets.json,final-verification.json,release-pc-share.png,release-mobile-share.png}.
- Status: requested scoped release complete. Earlier no-release notes describe the implementation stage. No remaining approval or deployment action for this scope; people-builds remains a separate review-pending task.
