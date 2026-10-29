# Five-language authenticated publishing and account sync — 2026-10-29

Status: COMPLETE. Base edbc54758db14ff78f12e2744ee1b6b11978ea93.

## Accepted scope
User accepted the next recommendation: verify real Steam login/re-login, public build authoring/editing/publishing/sharing, and same-account synchronization for fr/de/es/pt-BR/ru on desktop and mobile viewport. Fix only reproduced copy/layout/client-state issues; auth/security policy is excluded. Existing original plans, Chrome1 and IAB8 saved copies, old posts and the primary checkout's 302 pending paths must be preserved.

## Coordination
Claude readonly allocation relay1/max4 finished 2026-10-29T12:35:35Z; runner exit0, execution status0/errornull/scope[]. Codex owns UI/implementation; Claude final review. Allocation suggestion about synced authored drafts is corrected: unpublished author drafts are same-tab/24h only, not cloud settings. Public posts are fetched from the server. No visibility toggle exists in current UI. Use one clearly labelled QA post and leave it rather than permanently deleting it. Existing admin Steam account is available in Chrome and IAB; ordinary reauthentication succeeded without credentials or token extraction. Only the locale is temporarily changed for automatic settings sync, then restored to Korean.

## Preconditions and expected results
- Two distinct browsers on the same existing Steam account, PC1440 and mobile360 viewport (not physical handsets).
- Capture original account/locale/planner/library state via visible UI; only change an isolated public composer draft and one QA post.
- For all five locales: localized authoring and account states; inputs/skills/notes survive language change, save/reopen, and refresh; no page overflow or obscured required controls.
- Publish QA content explicitly marked not gameplay advice; read in another session, edit there, and verify server revision via normal reload.
- Language changes automatically propagate to the second logged-in browser without manual import; logout/relogin returns to same locale and own post.
- Failure boundaries: missing human Steam authentication is reported; do not bypass. Missing/failed locale or session recovery must retain authored draft. No claim of real failure injection unless exercised.
- Keep public sharing distinct from automatic settings sync and same-tab draft recovery. New browser starts signed out because login is session-tab scoped; do not claim otherwise.

## Evidence
D:/CodexData/Projects/ASBC/artifacts/five-language-auth-20261029
Initial production Chrome and IAB re-login succeeded; account admin, original locale ko, server settings last saved 2026-10-28. Primary302 baseline captured before implementation.

## Reproduced findings and scoped implementation
- Successful logout left the prior "signed in through Steam" notice visible beside the signed-out login CTA. Clear only the transient Steam pending/notice/error UI state after successful logout; no token/session/security policy change. Production before screenshot saved.
- All five translations of the 24h same-tab draft notice incorrectly demanded another login despite an active session. Make re-login conditional and keep the 24h/no-other-device limits explicit.
- All five editor-intro translations implied publishing also changes the personal planner. Clarify the isolated copy and that only the public post updates on save.
- Russian point explanation incorrectly described Daevanion as equipment. Correct this one phrase. Total 11 locale-field updates, no ko/en/ja/fi changes.

## Production baseline QA (before deployment of these fixes)
Real Chrome plus IAB authenticated as the existing admin account through ordinary Steam OpenID. Chrome logout/relogin restored French locale, unpublished QA title and Vicious Strike base9. Created exactly one QA post: https://asbc.app/#published=21db2f99-e426-4849-a550-4483d6b3da01. Clearly states interface test only, not gameplay advice. Source private plan projected without character/notes. PC draft skill base10->9 (383->379 SP), Shield Smite node removed (316->313 Daevanion), gear-note input, preview and publish succeeded. Same-account mobile edit base8 saved. For DE/ES/PT-BR/RU, PC1440 and mobile360 edit/save/reload all passed with first-skill base9/8, final13/12; no document horizontal overflow. FR real PC create/mobile edit passed. Chrome copied share URL matches the post. FR Chrome->IAB locale and DE/ES/PT-BR IAB->Chrome locale auto-updates passed without manual import. RU check pending. Library baseline: Chrome1 original named copy, IAB8, contrary to the generic initial eight-copy note. Old two posts preserved. No original planner application performed.

## Checks before review
Typecheck; build-editor (8 classes); public-builds; account-settings; localization; production frontend build; SEO: all exit0. checks.json contains actual commands/logs. No backend change. New-source production logout/translated-form checks remain after reviewed deployment.

## Peer review and release readiness
Claude final readonly relay2/max4 PASS, execution finished 2026-10-29T12:51:10Z, runner exit0/status0/errornull/scope[]. Reviewed exact two-source-file delta and all11 locale fields; confirmed logout notice resets only on successful response. No auth/backend/security policy change. Nonblocking follow-ups retained out of scope: equivalent older-language wording and hypothetical account-deletion transient notice.
All23 production baseline cases passed, including RU automatic locale sync, all5 dirty-draft language switches preserving skill8 and text, own unsaved QA-draft discard preserving published note, and copied URL opening anonymously without owner-edit controls. UI evidence adopted and hashes checked.
Release contains only two source files, this task record and an append-only PROJECT_BRIEF note. Source build ready; final new-source production checks pending deployment.

## Completed deployment and final production verification
- Source commit f70bf00acd30b96ad3b10526a03f3fcb2fcac6ad was integrated into main and pushed normally. The primary checkout retained all302 pending paths/statuses:300 byte-identical, PROJECT_BRIEF append-only, and the UI dictionary preserved all unrelated fields while merging exactly11 task fields.
- Cloudflare Pages deployment succeeded, including Functions bundle: https://578c656d.asbc-4c9.pages.dev. Both real production browser DOMs loaded /assets/asbc-D8yESPKo.js from asbc.app.
- All23 baseline cases and all14 post-deployment cases passed. New-source checks covered all5 locales at1440/360 widths; all corrected editor/draft notices matched, including the Russian point explanation, with no document overflow.
- Regression precondition verified: a fresh ordinary Steam re-login displayed the success notice. Subsequent successful logout removed that notice and displayed the guest login link. Re-login restored the same account and locale. Restoring Korean in IAB automatically updated Chrome without a manual import/reload.
- Private GreenOrc settings were read-only throughout. Original named copies remain Chrome1/IAB8; the eight IAB names exactly match baseline. The two old public posts remain. Only one clearly labelled QA post was created and edited: https://asbc.app/#published=21db2f99-e426-4849-a550-4483d6b3da01. Its text states interface testing, not gameplay advice. No permanent deletion was performed.
- Both locales restored to Korean, both viewport overrides reset, and only the task's own Chrome/IAB/anonymous tabs closed. All57 UI evidence files adopted to the ASBC artifact directory with SHA256 verification; the exact owned HomeSphere staging folder was removed.
- Validation boundary: actual Chrome and IAB with desktop/mobile viewports, not physical Android/iOS devices. No claim of failure injection or whole-account/draft cloud sync: unpublished drafts remain same-tab24h; named library copies remain device-local.
- Remaining follow-ups are outside this task: the older-language equivalent wording noted by Claude, broader timer/ranker/ledger locale QA, and physical-device checks. This final documentation-only commit requires no second frontend deployment.
