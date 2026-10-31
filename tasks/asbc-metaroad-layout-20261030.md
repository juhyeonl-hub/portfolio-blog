# ASBC home and shared layout

Owner: Codex implementation and browser QA; Claude allocation and read-only review
[Task Goal]: Reorganize ASBC home and common page navigation/layout, informed by the user-selected Metaroad Aion2 hub. Codex will use existing ASBC content and assets, route to existing tools, preserve calculator/build/map/account behavior, and verify responsive navigation plus all9locale layouts. Main repository302 pending changes excluded. Reference https://metaroad.gg/aion2 observed2026-10-30: common top navigation, compact timer strip, prominent tool entries, grouped class content and useful side column.
Scope: home panel, shared header/navigation, page shells and responsive styles; small companion locale keys if required. No backend, calculations, persisted schema or unrelated changes.
Done when: tools are directly discoverable, same navigation across planner/readers, class choices open the right existing planner; PC/mobile keyboard/back/forward, existing data and9locales verified.
Base commit: fe521400a957583a5ae228ea5002bae9c41d6576
Verification: PASS typecheck, lint, 45 test scripts, navigation checks, production build; browser responsive navigation, save/share, 9 locales
Last verified: pre-task tracked worktree clean; primary302 paths snapshotted
Last reviewed: Claude final read-only PASS 2026-10-30T22:35:31Z; tasks/collaboration/runs/asbc-metaroad-layout-final-20261031-1793399701386/reply.txt
Findings: Metaroad reference viewed; use layout patterns without importing its images/brand/content.
Uncommitted: task and brief only
Next: user reviews local preview; no commit/push/deployment for this layout task
Blocker: none

Claude allocation: status0, scope[], no errors. Codex visual/layout implementer; Claude readonly reviewer. Implemented shared top nav in both shells, reused mobile focus trap and extended inert boundary, no native dialog rewrite. Existing global timers remain above shared nav; measured nav height only for scroll offsets. Home class grid uses existing onClassChange/goTo. All persistence/routes/game rules unchanged. 12 new source labels translated into8languages.

Implementation verified: npm run typecheck:shadowcraft, npm run lint, all45 test:shadowcraft scripts, build:asbc exit0. New12locale keys, route tests pass. Browser1440x1000 +390x844: Templar class choice, skill total350 persists after home/back, named local build saved, shared preview opens, reader->library finds saved name, back->reader->map works. Mobile Tab and Shift+Tab wrap within drawer, Escape restores opener and body scroll. Save anchor157px vs sticky header bottom141px. Discovered/fixed legacy favorite grid placement and backdrop-filter fixed-position containing block. More locale/route checks continuing outside repo while Claude reads. No production changes or public content written.

Claude read-only review finished22:27UTC: no blockers, four lower-risk findings. Addressed all: inert header controls, conditional aria-controls, desktop drawer breakpoint1199px after actual1101px German/Russian overlap, button titles now strong instead of nested headings. Also actual390px Updates summary overflow fixed with mobile single column. Runtime checks: all11destinations desktop/mobile; all8class cards; all9locales1440/390 no home overflow/broken icons/Korean outsideko; actual360shared reader;390point350 edit/named save/reload/share-reader->library passed after waiting visible saved entry. Window-open reader tab did not obey viewport override; repeated mobile tests in managed tab with asserted innerWidth and UI readiness. Ignore preliminary immediate-read missing saved entry (lazy panel had not finished); final visible-name waits succeed.

Final scope audit: primary302pending paths/status/bytes unchanged; main/worktree HEAD unchanged; no staging/commits/deployment. Only scope files plus task/coordination evidence added. Final artifacts /mnt/d/CodexData/Projects/ASBC/artifacts/metaroad-layout-20261030. Checks: all45tests initial PASS; finaltypecheck/lint/navigation/build PASS. Standalone navigation initially invoked from frontend failedENOENT; corrected workingdirectoryshadowcraft passed. Browser checks, screenshots saved in artifacts; responsive viewport simulation (not physical phones); production only readonly proxy. Local preview port4207 retained for user review.

Final state: all review findings resolved. Final breakpoint1279px, with9locales at1279/1280 showing no overlap. Saved screenshot evidence and browser-evidence.json under artifacts/metaroad-layout-20261030. Local preview http://127.0.0.1:4207/#/ remains running as session23215; IAB deliverable tab91. Finalized 2026-10-30T22:39:18.657768+00:00
