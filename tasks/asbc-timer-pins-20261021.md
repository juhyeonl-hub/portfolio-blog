# ASBC global timer and content pins
Owner: Codex (Claude allocation completed)
Scope: global sticky timers, discoverable browser-wide content pins, remove duplicate home build CTA.
Done when: all routes sticky, pin persistence/server switching/legacy compatibility/storage errors verified, mobile and 4 locales pass, type/lint/tests/build pass.
Base commit: 8f274572c285e2c94ee7333b7882599c3a72d79d
Inputs: selected TimerIds, existing v1 settings, routes and viewport. Outputs: pinned cards on every screen, common pins saved locally, existing per-server times unchanged.
Failure cases: invalid stored pins, blocked storage, empty selection, other-tab updates, narrow screens, overlay/anchor interference.
Verification: typecheck:shadowcraft + lint + all 29 test:shadowcraft scripts passed. Browser timer_pins, event_timers, boss_timers, timer_timezones, population_timer_sync, asbc_home, deep_links, editor_clarity, screen_localization all passed. Final focus-exit fix: timer_pins/event_timers + typecheck/lint/localization passed again.
Last verified: 2026-10-21, WSL Ubuntu-22.04 / Chromium, local Vite 5184. Evidence: D:/CodexData/Projects/ASBC/evidence/timer-pins-20261021.
Last reviewed: Claude read-only implementation review completed status=0,error=null,scope=[], no blocking defects; localStorage compatibility and failure handling confirmed. Later small keyboard-exit fix self-verified, not peer re-reviewed.
Findings: timer already globally mounted but hidden via CSS; both home CTAs navigate to quick. Keep planner card and remove duplicate hero CTA. No external data/schedules changed.
Uncommitted: current task files only; preserve existing context/cache/collaboration untracked.
Next: completed. Source changes remain uncommitted; no new Git commit/push.
Blocker: none

## Review and verification notes
- Removed duplicate hero CTA; sole home planner card now says 빌드 플래너 열기. Both old links had routed to quick.
- All screens including privacy/shared use the same timer instance. Build pill/anchor offsets include measured timer height.
- Optional v1 pinned field overrides legacy server hidden only after explicit selection; empty array means no pins. Manual schedules/server profiles remain intact. Existing older settings load unchanged.
- Dedicated pin picker supports immediate save, escape/focus return, keyboard exit, cross-tab update and failure rollback. Preferences are browser-local, not account sync.
- Four locales at 320/390/1366px captured and visually inspected. Tests use controlled read-only API fixtures; no real accounts/public writes.
- Initial new test failed because evaluate returned an injected throwing function; fixed test wrapper, then failure recovery passed. First build itself succeeded, but shell exit-code wrapper failed; final build run uses subprocess with exact exit code.
- Existing large-chunk/plugin-time warnings remain. No schedule/backend/auth changes.
- Optional review nits (existing raw browser error wording/dead CSS, settings outside-click dismissal) left outside this focused change; existing untracked pycache/context/collaboration retained.

## Production result
- Final build exit 0. Artifact + hashes: D:/CodexData/Projects/ASBC/artifacts/timer-pins-20261021.
- Existing Pages asbc/main deployment succeeded: https://b0be2bc3.asbc-4c9.pages.dev . Functions compiled and uploaded.
- https://asbc.app/ returned 200; live JS/CSS SHA-256 matched the verified artifact.
- Production timer_pins browser suite passed: all screen routes and privacy, sticky header/anchor separation, one home planner CTA, legacy settings, empty/common pins, reload/server switching, 4 locales × 3 widths, mobile-menu inert, cross-tab update, storage failure rollback, keyboard exit.
- Production test used isolated browser local settings and controlled API GET responses. No real account/public writes.
- Final production screenshots are pins-*.png in the evidence directory (replaced earlier local visual captures). Local test logs remain separate.
- Original unrelated untracked files unchanged. No stage/commit/push in this follow-up.
