# Header timer drag scrolling
Owner: Codex. Base: f90253c7cc8210bc34b2958d8f5e53467eab1428.
[Task Goal]: Hide only the compact header timer scrollbar and support mouse drag scrolling; leave the dedicated timers page unchanged.
Scope: event-timers.tsx and globals.css; no timer calculations, stored settings or unrelated source changes.
Expected: left-button drag pans compact cards, release/cancel/lost capture ends dragging, text is not selected; touch and keyboard scrolling remain available. Expanded timer page retains its grid and pin buttons.
Verify: isolated typecheck/build, PC and mobile browser drag/release, keyboard, settings buttons, dedicated-page regression.
Authorization: user requested small UI fixes be deployed immediately after verification. Main commit/push and production deployment authorized. Prior no-Claude-cross-review preference applies.
Claude 불가로 Codex 임시 조율: existing recorded usage limit until Oct 26 14:00 Europe/Helsinki; no retry and no review pass claim.
Evidence: D:/CodexData/Projects/ASBC/artifacts/header-timer-drag-20261023.

## Verified before release
- PASS isolated typecheck:shadowcraft and build:asbc. Existing bundle-size/plugin-timing advisories only. Built entry: asbc-DZR_qr9n.js / asbc-C0dpCSjK.css.
- Before: mouse drag left the header scrollLeft=0 and selected timer text.
- After: 400px mouse drag moved scrollLeft from 0 to 400, selected text empty, dragging state cleared after release.
- Reverse drag released outside the header moved scrollLeft 400 to 50 and correctly released capture.
- Native ArrowRight moved focused strip 50 to 90; keyboard scrolling retained.
- Mobile 360x800: page clientWidth=scrollWidth=345; header drag moved to 290; no text selection, no scrollbar, dragging state cleared. Native touch-action stays auto; no touch interception (physical phone not used).
- Server settings button opens after drag. Dedicated timers page remains grid, no drag cursor/tabIndex, three event cards, independent pin button works.
- Source scope exactly two files. All 212 preexisting dirty/untracked files unchanged.
