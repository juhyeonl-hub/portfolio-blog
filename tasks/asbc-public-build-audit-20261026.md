# Public build live usability audit — 2026-10-26
Owner: Codex. Claude 불가로 Codex 임시 조율: existing usage_limit until Oct26 14:00 Helsinki; no retry before reset.
[Task Goal]: Exercise production create/edit/share on PC and mobile, then fix evidenced beginner friction without unrelated changes.
Scope: public build composer/discussion/view and scoped CSS, recovery helper and tests. No backend, auth configuration, personal planner, ledger or SEO changes.
Done when: real production test post saved/reopened/edited/shared, findings addressed in isolated source and tested at1440/390, prior changes preserved.
Inputs/expected: skill/node/equipment edits survive save and share; expired login cannot silently lose the authored draft; fields and actions stay readable and reachable below timers.
Failure cases:401,500,invalid or stale draft,other account,over-budget,clipboard failure,mobile overflow,unintended planner mutation.
Base commit:00644f6c914da5ef6bc507e6f278ea5a0a1bf502
Verification: production create/edit/anonymous share PASS; isolated/integrated TypeScript, targeted suites, final build and PC1440/mobile390 UI PASS. See artifact verification.md.
Last reviewed: self-review complete; Claude cross-review explicitly waived for this release by the user on 2026-10-26. Waived, not passed.
Findings: production expired session on publish remounts scoped app and loses draft; sticky editor tabs hidden under fixed timers; textarea uses browser white styling.
Uncommitted: no source changes for this task; unrelated pending work preserved.
Next: complete. Keep unrelated pending work out of future releases unless authorized.
Blocker: none. User explicitly authorized main commit, push and production deployment without Claude cross-review.

## Completion

- Signed-in IAB tab45 initially had an expired ASBC session. POST caused account scope remount and lost the unsaved composer. No post was created by that failed request.
- Existing Steam session completed ordinary reauthentication without credentials/settings changes.
- Created exactly one labelled test post: https://asbc.app/#published=f1337ebe-18a7-43da-bfa3-d869abb3c498 . Title now [기능 확인용] PC 작성·모바일 수정 완료 2026-10-26. Description explicitly says this is not a gameplay recommendation.
- PC1440: changed Templar base skill10->9 (SP203->199); added Capture node with path (Daevanion136->142); authored skill/node notes and equipment text; published and reopened successfully.
- Mobile390: changed title, base9->8, equipment reason; saved and reopened from the same URL in a separate unauthenticated tab. Skill base8, final10, Capture final2 and new equipment text visible.
- Existing Test post was not edited/deleted. Actual personal planner still SP203/383 and Daevanion136/316, Fierce Strike base10/final12. No planner application, likes or comments sent.
- Test post remains clearly labelled. No destructive cleanup attempted.

## Improvements (7 source/test files)
- Same-tab draft recovery for up to24hours, scoped to member, new/post identity and server revision. Private planner fields and tokens excluded; incomplete equipment text retained. Not account/cloud sync.
- Reauthentication offers a return-to-draft link; session expiry provides a clear sign-in message; wrong account cannot resume another account's draft. New server revisions do not silently restore older revisions.
- Cancel asks whether to discard; successful publication/update and explicit discard clear the recovery draft.
- Post sharing link/copy control explains that no login is needed to read and later edits appear at the same link. Manual selection fallback on clipboard denial.
- Editor tabs and node inspector offset below live timer height; bottom save/cancel, readable dark textareas and mobile16px input text. Point total/base/final-level explanation. Empty/whitespace title prevents submission.
- Four current UI languages retained;14 new manual en/ja/fi translations. No new locales, gameplay claims or backend/auth policy changes.

## Verification
- Isolated and integrated TypeScript PASS.
- Build editor:8classes and connected-node/locked-level/budget/independent draft regression PASS.
- Recovery tests: account/post/revision isolation, unfinished equipment, expiry/future timestamp, malformed data, quota failure, private-field rejection and clear PASS.
- Build share8classes×3gear modes, public list/detail payload validation and localization55isolated/56integrated screens PASS.
- Account-settings regression (load/apply/offline/conflict/logout race/privacy/explicit stigma) PASS.
- Isolated final production build PASS. Existing large-chunk and plugin-timing warnings remain; fixture excluded from production inputs.
- Real UI local fixture with actual MemberProvider and keyed account-scope remount: create + edit401, same-account reauthentication and recovery;500 and409 preserve content; mobile node change; save/reopen; cancel keep/discard; clipboard success + denial fallback. Personal plan unchanged. Final fresh browser console no errors.
- PC1440/mobile390 screenshots reviewed; mobile document375/client375. Browser viewport checks, not a physical phone test.

## Issues during work
- Initial JSX closing-brace error and optional legacy authorId type error fixed; final type/build checks passed.
- D-drive Vite file-watcher cache retained old community code after a source edit. Restarted owned dev server and verified expired-session message with a fresh tab. An old fixture HMR createRoot warning was fixture-only; final fresh tab has no errors.
- Screenshot direct write to ASBC artifact directory was blocked by sandbox. Saved in the writable workspace, then copied using approved filesystem command. Adopted screenshots reside under D:/CodexData/Projects/ASBC/artifacts/public-build-audit-20261026.

## Isolation and release status
-226 preexisting paths preserved;224 byte-identical, old PROJECT_BRIEF prefix exact, preexisting translation values retained with14new entries appended. Unrelated ledger/SEO/home/global/locale changes untouched.
- Existing source HEAD remains00644f6; no stage, commit, push, deployment or production backend change during this audit.
- Claude unavailable: prior execution.json usage_limit until Oct26 14:00 Helsinki. No retry. Codex interim coordination. Self-review done; new recovery-storage change cross-review pending. Previous waiver applied to the previous release only.
- Production currently runs the previously deployed editor; additional fixes are implemented and locally verified, not yet deployed.

## Release authorization — 2026-10-26
User explicitly requested only the verified public build authoring, editing and sharing improvements on main, push and production deployment, without Claude cross-review. Claude remains usage-limited; Codex temporary coordination continues. Cross-review waived, not recorded as passed. No backend or database change.

## Production release — 2026-10-26
- Explicit user authorization: commit only the verified public build authoring/editing/sharing scope to main, push and deploy without Claude cross-review. Waived, not passed.
- Source commit: 887ce19d6b0cfe55a5c1e4cef8550742adf39476; pushed to origin/main.7 source/test files and2 task-only records. Dictionary changes are exactly14new entries; unrelated dictionary/SEO/ledger/global/home work excluded.
- Cloudflare Pages deployment: https://b32be9cc.asbc-4c9.pages.dev; production https://asbc.app . Existing Wrangler4.151.3 used; API Functions compiled/uploaded. Frontend-only release; no backend restart, migration, auth/security setting change.
- All2143tracked frontend files match the selected release tree. TypeScript, build-editor/recovery, build-share, public-builds, localization and account-settings suites PASS. Isolated production build PASS; existing chunk-size/plugin-timing warnings remain.
- Production HTML and10selected JS/CSS/locale assets match release bytes. Public health status ok. Existing test post remains readable and revision unchanged after final browser checks.
- PC1440x1000: new share URL field and copy success feedback shown. Edit base8->7 changed used SP195->191 only in the unpublished draft. Navigating to account shows return-to-draft; resuming at390x844 restores the exact temporary title and base7.
- Mobile390: document/client375/375; input16px; sticky tabs top180.671875px equals timer height. Equipment tab clickable, dark inputs and bottom save/cancel visible. Cancel confirmation/discard clears the test draft and restores original read-only base8. No saved post, private planner, like or comment mutated in this release verification.
- Separate anonymous mobile reader shows correct title, base8/final10, share URL, and login-required voting; console errors empty. Physical phone hardware not tested. Account page and normal viewport restored.
- Clipboard limitation: production copy success feedback appeared, but tool clipboard read/paste retained the earlier localhost fixture text. Exact clipboard contents were not confirmed by this production tool run; the displayed production URL was confirmed. Prior isolated clipboard success/denial tests passed. No speculative application change made for this tool discrepancy.
- Evidence: release-pc-share.png, release-mobile-editor.png, release-mobile-share.png, production-assets.json, checks.log, build.log and deployment.log under D:/CodexData/Projects/ASBC/artifacts/public-build-release-20261026.
- All233previously captured working paths unchanged by source commit/deployment. Only the task record and task-only brief addition updated in this final documentation commit. Ordinary index stays empty; no stash/checkout/reset of working files.
- Completion: requested source release and production verification complete. No pending Claude approval for this scope.
