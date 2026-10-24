# ASBC immediate point guidance — 2026-10-24

- Owner: Codex. Claude 불가로 Codex 임시 조율: recorded usage_limit until Oct 26 14:00 Europe/Helsinki; no retry or cross-review claim.
- Scope: live point edits preserving ranker/board selection; used/remaining/total with known/unknown provenance; next connected node cues; validate and finish existing per-account settings sync. Exclude unrelated home population disclosure removal, context notes, collaboration logs and cache files.
- Baseline: 4dff880; dirty/untracked SHA256 and original files in D:/CodexData/Projects/ASBC/artifacts/live-point-guidance-20261024.
- Inputs: actual public character allocation, manually confirmed remaining points, editable planning totals, ranker target, account settings snapshots.
- Outputs: immediately updated budget-respecting guidance; preserved explicit confirmations; isolated account settings with safe conflict/offline handling.
- Failure behavior: unknown spent stays unknown; invalid input cannot overwrite valid values; failed/stale lookup cannot show previous ranker as current; no sync upload after failed initial read; no token/character response in settings transport.
- Acceptance: targeted regression suites, typecheck/build, desktop and 390px browser interaction, account sync fixture verification. No unverified game rules. Actual dual-device Steam session verification must be reported separately if unavailable.
- Status: in progress; no release operations this turn.

## Validation so far
- Live remaining entry: 104 used + 10 remaining -> total 114, 20 ->124 without blur; focus retained. Unknown SP/stigma usage keeps confirmed 30/5 without inventing totals.
- Desktop ranker WANN: 370 ->114 updates Triniel orange/blue 65/13 ->29/49, preview and tab stay open. Selecting Arwyn hides old result during lookup and restores selected Triniel automatically.
- Mobile 390px: Arwyn416 ->76 orange,0 blue on Triniel; no horizontal page overflow. Actual locked boards do not show next-connection arrows; incomplete node snapshots do not create false next steps.
- Two local origins simulate independent device storage. Alice114 -> mobile370 -> PC370. Offline350 survives reload; retry succeeds. Concurrent server update produces409, keeps local360, retry preserves remote favorites. Bob keeps114, Alice360; logout returns guest114.
- All configured frontend suites PASS; backend `mvn verify`72/72 PASS. New settings endpoint tests verify owner isolation, invalid/oversize input, revisions, concurrent first save, revoked session, cascade.
- PostgreSQL isolated-schema test was prepared but did not execute because sudo requires password. No authentication or privilege workaround. Production DB untouched.
- Actual Steam login on two physical devices is not verified. The browser sync tests used local fixture accounts only.
- No stage/commit/push/deploy yet. Unrelated baseline file hashes unchanged.

## Release boundary
- UI-only release: live budget inputs, used/remaining/total, next connection cues, ranker preview/tab preservation, their point models/tests and translations. No account settings backend/provider/storage adapter activation.
- Full candidate also passed typecheck, lint and production build. Existing home population disclosure remains in the release candidate.
- New account settings sync is implemented/tested, but release confirmation for the shared cross-review rule is pending (async question). No actual Steam two-device verification; no production DB operation.
- Signed-in users now see saving/saved/offline status; initialization failure blocks settings consumers rather than falling back to guest writes.
