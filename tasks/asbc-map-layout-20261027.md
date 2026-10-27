# Map viewport and controls — 2026-10-27
Owner: Codex implementation/QA; Claude coordination and read-only final review.
[Task Goal]: Show the whole official map immediately, move crowded controls away from the top, remove the official-map close and unnecessary custom-file import UI.
Base: adf5026858008bb75e8cdd8db2adffdc8c678daa. Primary302 pending files hashed, isolated worktree initially clean.
Scope: map-panel.tsx, terrain-panel.tsx, new scoped map-panel.css; map-only help/character-banner condition in page.tsx; task/brief. Keep game data, coordinate transforms, tracking schema/helpers and other features unchanged.
Observed production PC1440x1000: map SVG top1222px, bottom2041px, size819px; controls occupy the entire first screen. The map is already auto-opened but remains closable.
Plan: leave lazy first-entry loading, remove the close action; region/zoom remain compact, search/filters beside the map on desktop and below it on phones. Fit a square SVG to available viewport height and width, preserving coordinate/drag/marker geometry. Move detailed explanations into existing source/help disclosure. Remove manual JSON import UI.
Data clarification for coordinator: the imported dataset lives only in MapPanel useState and is NOT persisted or auto-loaded; only per-dataset completion keys persist. No saved dataset-render path exists after reload. Preserve every storage key and the shared parser/progress helpers, including legacy tests; removing unused upload UI must never clear those records or user files.
Expected: initial full-map bounds inside viewport; region switch/zoom/reset/search/marker selection and completion still work; scrolling/filter expansion never changes zoom or deletes progress. Resize/page re-entry retain valid square geometry. Missing data keeps existing retry/status; hidden route must not load terrain.
Verification: existing world-map/terrain/navigation/localization checks, typecheck/build/diff, actual desktop+mobile browser controls and collected-state roundtrip with test values restored. Claude read-only review before release. User standing instruction authorizes prompt deployment of small UI fixes; no new approval flow inferred from coordinator wording.
Status: coordination complete (execution status0, errornull, scope[]); implementation pending.

Local findings: PC/phone whole-map fit works; pointer drag uses unchanged coordinate scale. Completion1/61 survived reload and was restored0/61. Phone search initially left map under sticky header after the below-map input was focused; now collapse controls, focus map without implicit scroll, and scroll its toolbar below the fixed header.
Phone audit also reproduced overlapping individual teleport hit areas: clicking the visual center of Abandoned Campsite selected Steel Hammer Workcamp because it was painted later. UI pointer selection now resolves the closest displayed individual coordinate; cluster and keyboard actions are unchanged. No marker grouping/data/storage changes.

## Pre-release validation
Types, world-map, terrain-map, navigation, localization, diff-check and production build: PASS. Existing terrain tests validate all189 tile identities/hashes and lossless legacy record migration.
Actual IAB PC1440x1000, PC1200x800 and phone390x844 (browser viewport, not physical phone). PC1200 map x/y dimension488 square, top295.39 bottom783.39 inside800; phone width315 square, top399.63 bottom714.63 inside844; no horizontal overflow. Whole viewBox0/0/1000/1000. No close/import control.
Search Dawn Legion Base zoom4; mobile search Abandoned Wind Breeze Office closed controls and returned visible map top454 bottom769 with SVG focus. Layer toggles updated markers and retained view. Region switching Verteron/Altgard reset to full map. Drag produced x201.85 from250 atzoom2; keyboard right300/250; home→map reentry retained300/250. Completion1/61 persisted after reload; original0/61 restored.
Phone overlapping hit regression: Abandoned Campsite now selects Abandoned Campsite, not Steel Hammer Workcamp. Detail card readable, no horizontal overflow. Original local English language restored, ephemeral filters/zoom/region reset. No console warnings/errors.
Evidence: artifacts/map-layout-20261027/checks-final.json; screenshots before-desktop.png, local-desktop.png, local-mobile.png; source-freeze.json. Source frozen for read-only final review.

First final review timed out without stdout/stderr (status143, failureKind timeout, scope[]). Single permitted retry uses exact inline sources, no repository reads, timeout600s. Code unchanged; not recorded as review pass.

Read-only retry completed status0/errornull/scope[]. One P2: viewport-dependent window access during controlsOpen render initialization (pre-existing pattern). Addressed conservatively by initialfalse + mount effect, preserving initial PC/phone behavior; remaining layout/selection/lifecycle/accessibility reviewed without findings. Final delta review includes exact two map-only page.tsx conditions.

Final delta review: NO_FINDINGS; execution finished/status0/errornull/scope[]. Typecheck and production build re-passed after mount-effect fix. PC1200x800 initial controls open, mobile375x667 controls closed/map255px top395.83-bottom650.83/full viewBox/no overflow/no console errors. Main asset asbc-BGH606PC.js; CSS asbc-BJudFItI.css. Source frozen and reviewed. Release authorized by standing user request to deploy small UI improvements promptly.

## Release verification
- Source commit e2c9481a4195bd781bcaf762e2382b7d2b47be37 pushed to origin/main; Cloudflare Pages deployment https://023441e2.asbc-4c9.pages.dev succeeded.
- Production https://asbc.app/#/map serves asbc-BGH606PC.js / asbc-BJudFItI.css. IAB responsive browser checks: PC1440x1000 map623px/bottom918.39; PC1200x800 map488px/bottom783.39; phone390x844 map315px/bottom714.63; settled phone375x667 map237px/bottom650.63. Full viewBox0 0 1000 1000 and no horizontal overflow.
- Production region switch, zoom/reset, hidden-cube layer on/off, mobile search collapse/focus/map visibility passed; no console errors. Production collection records not changed. Local save/reload/restore already passed. Screenshots and evidence: D:/CodexData/Projects/ASBC/artifacts/map-layout-20261027. Physical phones were not used; mobile checks use responsive viewport.
- Primary existing301 pending files remained byte-identical; mixed PROJECT_BRIEF preserved plus task append. This task changes four product files only.
- Temporary verification tabs closed and viewport override reset.
