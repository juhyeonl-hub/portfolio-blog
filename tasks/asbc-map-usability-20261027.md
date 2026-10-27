# Map usability and completion persistence audit

[Task Goal]: Verify production map discovery and completion recording on PC/mobile; fix observed beginner friction and release only scoped changes.

Owner: Codex (coordination requested from Claude).
Base commit: 99dbcda84ad6468ad02cc7605de333056c163ece
Scope: terrain-panel.tsx/map-panel.css; progress helpers/tests only for reproduced defects. No game-data updates, account or unrelated changes.
Done when: region/search/zoom/cube display/completion+reload tested; verified fixes reviewed and deployed.
Expected: one completed location increments correct regional count once and persists reload; toggling back restores original state. Search/markers clearly actionable and remain usable at phone width.
Failure cases: wrong region marker, offscreen popup, lost completion, ambiguous save/total feedback, zoom reset, overflow.
Verification: pending. Last reviewed: pending. Findings: pending. Uncommitted: task setup only. Next: production audit. Blocker: none.

Claude coordination finished/status0/errornull/scope[]. Codex sole implementer/tester; Claude final read-only review. Production PC/mobile cube0→1→reload retained1/1371 in Altgard; both test-only cube IDs restored0. Friction: refresh resets Verteron/teleport-only, region switches drop cube filter, successful save gives no feedback, hide-completed and save failure messages buried in advanced disclosure.
Plan: tab-session region/layer preference (new independent key, completion format untouched); visible save success/errors; move hide-completed outside advanced; check badge on completed individual markers; use existing translated cube category name. Scope world-map.ts helpers/tests, terrain-panel.tsx, map-panel.css. Existing shared translation file has unrelated edits, so reuse existing translated phrases without editing it. Baseline includes314 default-Git paths (302 with filemode ignored).

## Local PC/mobile verification (2026-10-27)
- CUA browser UI: 1440x1000, 390x844 and 375x667 viewports; English/Korean. All six regions and remembered cube/teleport choices, no horizontal overflow.
- Known place search -> focus at 4x; zoom controls -> 8x; unmatched search -> No results; region switch -> full map.
- Complete cube 1110:1160290092:1301199:0 -> checked badge, Found 1/1371 and visible Saved on this device. Hide checked removes marker and retains visible feedback.
- Reload -> Altgard and cube layer restored; reselect same point -> checkbox remains checked. PC and mobile repeat passed; only test completion reverted, final count 0.
- All layers off remains off after reload with visible check-items instruction. Korean cube name now localized. Browser warning/error logs empty.
- Typecheck, world-map storage tests, terrain-map (189 tiles / legacy progress), localization: PASS.
- UI region/layer preferences use sessionStorage (same tab refresh/navigation). Collection settings keys and account sync unchanged. No assertion about current live cube presence.

## Final cross review / build
- Claude read-only review PASS, no blocking findings. Execution finished 2026-10-27T21:40:18.365Z, exit/status 0, error null, scope []. Source hashes unchanged.
- Review evidence: D:/CodexData/Projects/ASBC/artifacts/map-usability-20261027/collaboration/runs/asbc-map-usability-review-20261027-1793137002150.
- Production build PASS (32.03s): asbc-DJl-5nLI.js / asbc-RWGCzSyQ.css. Existing large-chunk warning only.
- Scoped product files: terrain-panel.tsx, map-panel.css, world-map.ts, world-map.mjs. No API, account sync, game data or completion schema edits.
