# ASBC usability follow-up — 2026-10-28
Owner: Codex; Claude read-only coordination/review.
[Task Goal]: Complete the first recommended usability pass: character-name discovery, current trade guides, truthful save/sync scope; audit remaining classes and language readiness. Release only the reviewed scope authorized by the user.
Base commit: e15be69bd8c36b792705dd4cb40ba0716caef061
Source commit: 73e57d92a63ff71e871032956c0b9f048986a31d
Scope: character-name menu and input order, home entry, EN/KO crafting guide, current-plan vs local named-library/growth/calculator guidance, existing EN/JA/FI translations. No game recommendation rules, API, storage schema or locale enablement change.
Done when: scoped implementation, related checks, PC/mobile verification, read-only review and authorized main push/production release verified. COMPLETE.
Expected: existing #/people and author deep links work; name input first; example5254x2+400=10908; tax10% break-even12120, firstpositive12122,10%profit target13333/net1091.
Verification: PASS typecheck:shadowcraft, test:seo14guides/15URLs, localization, navigation, build-library, trade-workbench. classes/build-purpose all8; ranker56budget+576skill+32combined cases. Production build PASS with existing largechunk warning.
Last verified:2026-10-28. Local PC1440x900/mobile390x844: GreenOrc lookup/detail, author tab, named copy save/Export/delete restored0, six other classes each12active icons without overflow, EN/KO static guide tables/CTA. Production PC search, mobile local-library guidance, EN/KO crafting guides and expected asbc-6OwMgD8o.js observed after release. Browser console errors:none. No production planner or library writes.
Last reviewed:Claude read-only PASS at2026-10-28T20:22:02.836Z; status0/errornull/scope[]; frontend hashes unchanged through commit. This was a source-snapshot review, not an exact-commit review.mjs run.
Authorization:user explicitly answered 이번 변경만 운영에 배포 after seeing scoped changes and completed review.
Deployment:https://fff4ad99.asbc-4c9.pages.dev ; production https://asbc.app ; main/origin source73e57d9 pushed. Cloudflare Pages upload19files,1896alreadyuploaded; no backend deployment.
Preservation:primary302pendingpaths kept with unchanged status. Existing home PopulationPanel change,29new/1modified translation entries and mixed PROJECT_BRIEF retained; isolated commit includes none of those unrelated edits. Artifact integration.json records guards. Source worktree clean with core.filemode=false.
Limitations:mobile viewport emulation, not a physical phone. New login/authenticated session behavior unchanged and not re-tested in release. urllib public-HTML check returned403; no bypass/retry, production browser UI and script URL confirmed instead. Wrangler dirty warning is Windows/WSL mode-only noise; source content clean.
Findings:Assassin rotation[] is backed by dedicated page/macro UI, not missing content. No unverified meta advice added. English Pummel tooltip still references 응징의 일격; validate official skill naming in a separate follow-up. fr/de/es/pt-BR/ru remain unsupported; full UI/catalog/account/backend coverage is needed. This pass does not claim all Steam languages supported.
Artifacts:D:/CodexData/Projects/ASBC/artifacts/usability-followup-20261028 (review hashes/reply/execution, source.diff, class audit/UI, production screenshots, integration and deployment records).
Uncommitted:no source changes remain in the dedicated worktree. Primary unrelated work remains pending.
Next:no release work remains. Separate follow-up: English tooltip references and complete remaining Steam locale coverage.
Blocker:none.
