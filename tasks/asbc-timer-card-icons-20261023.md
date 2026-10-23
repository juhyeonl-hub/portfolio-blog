# Compact timer cards and category icons

Owner: Codex. Base: 6b8bb99. Claude 불가로 Codex 임시 조율: existing execution.json reports usage_limit, resets Oct 26 14:00 Europe/Helsinki; no retry and no review pass claimed.

[Task Goal]: Make dedicated content-timer cards smaller and visually distinguish Shugo, dimensional invasion/rift, field bosses and Abyss bosses.
Scope: event-timers.tsx presentation only, timer-page.css, category label translations. Reuse installed Lucide icons; no game facts, schedules, API, pin persistence or unrelated pending work changes.
Expected: compact readable cards at PC and mobile widths, visible category icon/name, same countdowns and pin behavior. Rift selection must display rift identity rather than invasion; unknown bosses must not be called field/Abyss bosses. Long labels, no server, empty filters, fullscreen, keyboard and touch pin controls must remain usable.
Done when: isolated source typecheck/build and relevant timer tests pass; direct PC/mobile UI inspection confirms layout, correct classifications and pin behavior.
Verification: pending. Last reviewed: none. No commit/push/deploy requested for this iteration. Existing project brief is preserved; this scoped task records the requested ASBC work.

Done: compact 4-column PC grid with typical 117px cards; separate Shugo/Coins, invasion/Swords, rift/Orbit, field/Skull and Abyss/Eclipse icons and readable labels. Unknown category uses CircleHelp and unclassified text. Category labels follow locale. Pins are small icon buttons with accessible names, pressed state, tooltip and visible usage instruction. Region names remain available on title hover; header layout remains compact.

Verification (2026-10-23): isolated TypeScript/build PASS, event-timers.mjs and boss-timers.mjs PASS; no scheduling or persistence logic changed. PC 1440: four columns; fullscreen seven columns and 56 cards. Categories 1 Shugo, 1 invasion, 48 field, 6 Abyss; rift profile correctly swaps icon/name. Mobile 390: two columns; initial 360px countdown wrap reproduced and fixed by placing mobile pin below countdown. Retest 360: width 345/345, all displayed countdown heights 24px, typical card heights 130-154px. Korean/English long labels, keyboard pin/unpin, seven pins on home header, empty search, no-server state and fullscreen exit checked. Existing bundle-size/plugin-timing warnings remain. No new functional failures.

Preservation: all 212 preexisting pending files checked. Only translation file gained four entries; its original entries and every other prior file were preserved. Isolated source is HEAD plus only these three source files and new translation entries. No stage, commit, push or deployment. Last reviewed: none. Artifacts, scope hashes, patch, build manifest and screenshots: D:/CodexData/Projects/ASBC/artifacts/timer-card-icons-20261023. Preview stopped, browser tab closed, viewport reset. Production settings unchanged. Next: release only if requested. Blocker: none for this UI task.

Release authorization (2026-10-23): user said proceed after the verified card/icon changes were reported as not yet deployed. Scope is these timer changes only, main commit/push and production deploy. Prior explicit no-Claude-review preference remains applicable; no review pass is claimed. Release checks: main and origin/main both 6b8bb99; tested scoped source/build hashes unchanged; index empty; isolated translation file equals HEAD plus only four timer entries.

Release result: source commit `325f68ae10d21eb8c385d5b2fa56122c62bb0541` pushed to origin/main and deployed to Cloudflare Pages (`https://0f93c1c1.asbc-4c9.pages.dev`). Canonical `https://asbc.app` index and all four entry assets returned HTTP 200 with hashes identical to the tested build.

Live deployment UI: EU Ludra 56 cards, correct 1 Shugo/1 invasion/48 field/6 Abyss categories, PC four columns, pinning Watcher Kaira produces seven pinned cards. Mobile 360: width 345/345, all countdowns stay one line (24px high), card heights 130-154px. Canonical domain new page text visibly loaded. Configuration tests used the unique deployment origin so canonical asbc.app no-server/six-pin settings remained unchanged. Tab closed and viewport reset. Screenshots and production-release.json saved in the task artifact folder.

Preservation after release: 214 pre-release pending file hashes unchanged; only this task document gained authorization/results. Existing unrelated work remains unstaged. No Claude cross-review performed or claimed.
