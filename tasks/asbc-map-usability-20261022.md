# Map usability — verified locally
Owner: Codex — Claude 불가로 Codex 임시 조율; known usage_limit until 2026-10-26 14:00 Europe/Helsinki, no retry.
Base: ba7a012 with prior uncommitted Steam/equipment/Daevanion work preserved; baseline diff in D artifacts/map-usability-20261022/before.patch.
Scope: user nine map requests. No stage/commit/push/deploy.
Findings and changes:
- Removed whole SVG marker focus outline; retained a small accessible focus/selection ring. Detail card appears opposite the selected point on desktop and below the map on mobile.
- Clicking a single marker no longer changes viewport. Only explicit position-list navigation or a cluster click changes view. Selection does not complete or hide a point.
- Completion displays exact done/total and two-decimal percentages. One gather completion previously rounded to 0%; now 1/2733 and 0.04%. Persistence schema, dataset names, IDs and hashes unchanged.
- Replaced global first-400 cutoff with spatial grouping by category (and resource for gather). Every visible candidate is represented; sealed/stronghold/teleport markers retain independent visibility. Selected point remains ungrouped and draws last. Maximum zoom shows individual points.
- Controls above full-width square map; no nested control scrollbar. Extra position list and records are collapsible. Detail scrollbar hidden while retaining scrolling; mobile detail has natural height.
- Prevent text selection during panning; marker pointer events do not start map drag.
- 232 display names: all map region labels, gathering resource names and teleport names translated to Korean/Japanese/Finnish; English uses the original. Both translated and original region-name search supported. Translation provenance explicit; these are ASBC translations, not verified official Korean terms. Other NPC/quest names without a display translation retain source names.
- Reset button renamed to zoom/position reset; disabled at default viewport, functional after zoom/pan.
- Existing dataset contains 21 unique gathering resources across regions; per-resource selection and tinted cells containing actual supplied candidate coordinates added. No arbitrary biome polygon or guaranteed live spawn claim. Region-specific available resources remain separate.
Verification:
- Frontend typecheck/lint PASS; all 32 frontend suites PASS including enhanced terrain-map tests (candidate coverage, independent layers, selected-point retention, max-zoom singles, bounded resource cells, fractional percentages, localization coverage).
- map_usability.py PASS: Verteron/Altgard × 1920/390/320, independent filters, no selection zoom/removal, completion counts/fractions, localized gathering, resource shading, full-width square, controls above, reset and drag without text selection.
- map_language.py PASS: Korean/English/Japanese/Finnish names, translated/original search, completion storage unchanged and no horizontal overflow.
- official_map_categories.py PASS: previous completion-key migration, sealed/stronghold/feather combinations, both factions, mobile.
- official_map_progress.py PASS: persistence, reload/region isolation, pagination, keyboard, malformed/quota storage preservation.
- Final production build PASS; existing bundle-size/plugin-time warnings only.
- git diff --check PASS.
- Baseline exact-diff comparison: all 14 prior tracked files outside shared CSS/dictionary unchanged; prior CSS additions preserved verbatim. Existing unrelated untracked files untouched.
Evidence: D:/CodexData/Projects/ASBC/artifacts/map-usability-20261022 (screenshots, unit/build/browser/category/progress logs, baseline patch).
Last reviewed: self-check only, not cross-review approval. Completion-record interactions cross-review pending under unavailable-Claude rule. No account, game or production writes.
Next: read-only cross-review when Claude is available; release only under a requested release scope.
