# Separate rift and invasion timers
Owner: Codex. Base: 89eed195e7976015bffe3294f0bd0679b3e8649e
Scope: event timer model/UI, settings migration and focused tests only. Preserve all unrelated pending changes.
User reported missing rift timer. Cause: one legacy dimension slot switches between invasion and rift. Goal: show Shugo/invasion/rift simultaneously, independent pins and manual schedules. Preserve old selected event, custom times, clocks and boss pins when migrating saved settings.
Authorization: user requested these small UI fixes be deployed directly after verification. Main commit/push and production deployment included. Prior no-Claude-review preference applies. Claude 불가로 Codex 임시 조율: recorded usage limit until Oct 26, no retry or review pass claim.
Verify: regression tests for migration, independent defaults/overrides/pins, empty selections and DST clocks; isolated typecheck/build; direct PC/mobile display, pinning and persistence checks.
Evidence: D:/CodexData/Projects/ASBC/artifacts/separate-rift-timer-20261023.

## Verification before release
- PASS: event-timers regression suite, including legacy settings migration, per-server fallback pins, separate schedules and explicit blank overrides. Boss-timers suite passed.
- PASS: typecheck:shadowcraft and build:asbc in an isolated HEAD archive containing only the three scoped source changes. Existing bundle-size advisory only. Entry asset: asbc-DlixKcJG.js.
- Direct browser, PC 1440x900 / mobile 360x800: all 57 cards / three event cards; Shugo, invasion and rift display together with distinct countdowns. Mobile clientWidth=scrollWidth=345 (no page overflow).
- Pin invasion off/on leaves rift pinned; both survive reload and appear together in the main header.
- Separate manual schedules 12:00 and 14:00 survive save/reload; both restored to defaults afterward.
- Actual previous v1 preferences migrated with EU Ludra, Helsinki clock and seven existing pins intact. Added invasion becomes eighth pin.
- All 212 preexisting modified/untracked files retain their initial SHA-256; staged index was empty.
- Local screenshots: pc.png and mobile.png in the artifact folder.
