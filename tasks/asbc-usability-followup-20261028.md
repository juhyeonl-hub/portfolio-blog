# ASBC usability follow-up — 2026-10-28
Owner: Codex; Claude read-only coordination/review.
[Task Goal]: Complete the first recommended usability pass: discover character builds by name, align trade guides and save/sync guidance with shipped behavior, audit other classes and language expansion prerequisites.
Base commit: e15be69bd8c36b792705dd4cb40ba0716caef061
Scope: display/copy, character search form order, EN/KO static guide, existing EN/JA/FI translations. No API, storage schema, game recommendation rules, locale enablement or unrelated pending changes.
Expected: same #/people links still work; character name first, author tab retained; crafting example 5,254 x 2 + 400 = 10,908, tax 10% break-even 12,120; current plans described as synced only when signed in; named library/history accurately local.
Failure cases: broken existing deep links, misleading cloud-save claim, incorrect tax/output example, narrow-screen overflow, translation gaps, user data mutation.
Done when: scoped implementation, related checks, PC/mobile viewport hands-on verification, readonly review; accurately report what is and is not released.
Verification: PASS; related checks, production build, PC/mobile viewport UI. Details below.
Last verified: 2026-10-28.
Last reviewed: Claude readonly PASS at 2026-10-28T20:22:02.836Z; execution status0/errornull/scope[]; frozen source unchanged.
Findings: old trade guide and current-plan browser-only text stale. Assassin rotation[] is NOT evidence of missing UI: page.tsx has a dedicated assassin rotation/position panel and macro-guide has dedicated columns. Do not fill with invented advice.
Language audit: 2,680 UI keys + 497 specialization templates plus separate skill/node dictionaries and comparison/crafting copy. fr/de/es/pt-BR/ru absent. Frontend lazy bundle, type unions, initial locale, account projection and backend validation all need full coverage before enabling. This pass records readiness; it does not claim added language support.
Uncommitted: this task only in detached dedicated worktree. Primary main's existing314 pending paths untouched.
Next: release explicitly authorized; then address documented English tooltip references and remaining Steam locales.
Blocker: none for implementation; Release explicitly authorized by the user on 2026-10-28.

## Completed first pass
- Character lookup name on both shells/home; character name first; existing author routes preserved.
- EN/KO craft sale-price guide matches UI and user-entered example: total10908, break-even12120, first positive12122,10%target13333/profit1091. Tax/output assumptions explicit.
- Current-plan sync vs local named copies/growth/calculator drafts clearly distinguished;20copies/class and per-copy Export/Import guidance, Steam account link. No storage or backend behavior change.
Verification: typecheck:shadowcraft, test:seo(14guides/15URLs), localization, navigation, build-library, trade-workbench; classes/build-purpose all8, ranker guide56budget+576skill+32combined cases PASS. npm run build:asbc PASS; existing largechunk warning unchanged.
UI:1440x900 desktop and390x844 mobile viewport emulation. GreenOrc EU/Ludra/Lv45 lookup and existing detail Skills/Daevanion; author tab; English home entry; guest named copy save feedback/Export/delete restored0; six other classes each12active skill icons without overflow; EN/KO trade tables/CTA. No production planner/user-state writes. Viewports reset, temporary tabs closed and preview server stopped. Evidence: artifacts/usability-followup-20261028/{desktop.jpg,mobile.jpg,class-ui.json,ui-verification.json}.
Last verified:2026-10-28. Last reviewed: Claude readonly PASS, no blocking findings, completed execution status0/errornull/scope[]; source hashes unchanged after review.
Remaining: English Pummel specialization tooltip still includes Korean skill reference 응징의 일격 (existing data; check official mapping before change). Five additional Steam locales not enabled: full UI/catalog/account/backend validation required. Audit is not gameplay meta validation.
Uncommitted: scoped source plus task/brief only. User explicitly authorized this scoped commit/push/production release on 2026-10-28. Primary worktree pending changes preserved.
Next: on release authorization, commit only allowlisted changes, verify current main baseline/preserve primary changes, push and deploy built source; otherwise retain reviewed implementation.
Blocker: none for implementation; release explicitly authorized.

## Release authorization
User answer: 이번 변경만 운영에 배포. Proceed with these reviewed menu/save-scope/crafting-guide changes only; preserve unrelated pending work.
