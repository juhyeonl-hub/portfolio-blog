# ASBC compact centered layout and advertising space
Owner: Codex, Claude allocation completed
Base commit: 8f27457 plus preserved timer/maintenance working tree
Scope: centered app up to1180px; 120px side rails at1360+, 160px at1600+; compact desktop navigation/type/spacing; no ad provider/scripts/tracking.
Done when: rail bounds/main sidebar offsets, desktop/mobile/locales, menu focus, sticky timer/build anchors, map/skill interactions pass; build and operating site verified.
Design: use centered #root so all routes including standalone views share rails; keep direct root children to preserve mobile inert logic. Fixed sidebar left matches centered frame; main margin matches176px/64px nav. No zoom/transform. Below1360 no rails; below761 existing mobile density retained.
Inputs: viewport, locale, nav collapsed, route, timer height. Outputs: usable compact app and outside ad slots without horizontal overflow.
Failure cases: sidebar overlaps left rail, 1550px old enlarged grids overflow narrower app, timer/banner covers rail/tab, 320px/zoom menu, shared routes.
Verification: typecheck, lint, localization, production build and git diff --check pass. Browser layout passes 12 widths / five screens / four locales / mobile focus / privacy / classic scrollbar gutters. Build anchor tests pass using actual header-relative bounds. Existing home/deep links/editor/timer/maintenance/terrain/map/localization browser tests pass.
Last verified: 2026-10-21 local and production checks pass
Last reviewed: Claude read-only review completed, no writes; reported classic-scrollbar 100vw offsets corrected to percentage widths/offsets and regression-tested.
Findings: original1920px root1920/main1694; before-source.zip and screenshots retained. Actual ad network integration intentionally not included in space-only request.
Uncommitted: existing changes preserved plus layout/task/test changes
Next: none for requested layout change
Blocker: none

Validation fixes: old build anchor assertion assumed top <220px; measured dynamic header places valid anchors at220px+, now compares actual header and section-bar bounds. Initial final layout test raced ResizeObserver after remote maintenance response; uses deterministic official fixture and waits for measured header CSS variable. Neither failed run is represented as passing.

Production: https://9347ca92.asbc-4c9.pages.dev deployed successfully to main; https://asbc.app returns200 and JS/CSS hashes match final artifact. Full ad_layout browser checks passed against operating origin. Screenshots in evidence directory now reflect production run. Existing timer/maintenance and unrelated working tree changes preserved; no new commit/push performed in this layout follow-up.
Evidence: D:/CodexData/Projects/ASBC/evidence/ad-layout-20261021
Artifact: D:/CodexData/Projects/ASBC/artifacts/ad-layout-20261021/final/dist-asbc

## Home footer banner follow-up (2026-10-21)
Owner: Codex; Claude allocation completed read-only.
Scope: one noninteractive translated placeholder between home utility links and footer,90px desktop/100px mobile. No advertising provider or tracking added.
Existing favorites/timer/maintenance/rail changes preserved. Desktop home fit check now allows requested banner height plus its spacing; small-height windows may scroll naturally.
Verification: typecheck/lint/diff check/build, extended ad_layout12widths, asbc_home, home_favorites, maintenance_banner and timer_pins pass. Claude final read-only review status0/error null/scope[] no blockers.
Next: none.

Footer banner deployment: https://e67bcf13.asbc-4c9.pages.dev (main); https://asbc.app HTTP200, JS/CSS hashes match artifact, placement/height/no-overflow pass at1920/1366/1024/760/390/320. Evidence D:/CodexData/Projects/ASBC/evidence/footer-ad-20261021; artifact D:/CodexData/Projects/ASBC/artifacts/footer-ad-20261021/dist-asbc. Existing dirty changes retained; no Git commit/push in follow-up. Placeholder only, no revenue generated until ad integration.
