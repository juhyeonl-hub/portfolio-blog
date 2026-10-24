# ASBC account screen and real Steam sync verification
Owner: Codex. Claude 불가로 Codex 임시 조율 (known usage_limit, resets Oct 26 14:00 Europe/Helsinki; no retry).
Scope: Actual Steam PC/mobile-width verification; clear account purpose, synced/local-only items, accurate server save time, manual pull.
Done when: scoped tests pass; actual-browser evidence recorded; unrelated home changes preserved.
Base commit: 3c97b52946d4039d5427163b8093cbc6a519048e
Verification: frontend typecheck/lint/account-settings/localization PASS; backend AccountSettingsControllerTest 6/6 PASS; isolated frontend/backend build PASS. Local browser 390px manual load across separate origins, offline/retry, unchanged save timestamp, language sync PASS. Actual Chrome Steam sign-in/save/reload PASS (temporary 317 restored to 316).
Last verified: 2026-10-24, local PC/mobile-width UI and actual Chrome production account.
Last reviewed: no Claude review; user authorized account sync release without review.
Findings: Chrome had old stale UI and expired site session; normal Steam sign-in succeeded. Independent IAB requires user sign-in.
Uncommitted: existing globals.css/home-panel.tsx/translation deletion excluded; baseline recorded in D artifacts.
Next: when user completes Steam login in independent IAB, verify actual cross-browser settings transfers. No further implementation required for this scope.
Blocker: actual second independent browser awaiting user Steam login, implementation continues.

Production source: 2b24307ac9a67ef06aef75d09f17a8fffcb09d82 (main pushed). Pages: https://a26789b4.asbc-4c9.pages.dev; canonical HTML and all entry asset hashes match isolated build. Backend JAR hash 58f17120b03202df3280e2c27da99d267dde505804e716026b10835f216f77fe; PID 54566 -> 58780; health OK; anonymous settings GET 403. Fresh database backup verified before deployment; no schema change.
Production verification 2026-10-25 00:06 Europe/Helsinki: real Steam account login; points 316->317 save/reload and restored 316; timer pins 11->10 save/reload and restored 11; map candidate completion 0/61->1/61 save/reload and restored 0/61. Logout displays guest 316 while account retains 317; normal Steam login restores 317, then reverted 316. Manual pull leaves actual server save time unchanged and advances device checked time. PC and mobile browser width verified; no physical phone test.
Artifacts: D:/CodexData/Projects/ASBC/artifacts/account-screen-20261024 (logs, scope/hashes, before-state, release proof, production-desktop.png, local-mobile.png). Chrome mobile screenshot capture scales the physical window; DOM geometry verified 390px viewport/375px scroll width and local IAB mobile screenshot retained.
Unrelated tracked files remain exactly the preexisting home panel/globals/translation deletion. No Claude cross review was performed. Actual independent second Steam browser validation remains pending user sign-in; not reported as complete.
