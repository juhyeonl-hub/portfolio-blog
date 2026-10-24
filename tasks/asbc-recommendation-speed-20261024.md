# Recommendation speed
Owner: Codex / single writer.
[Task Goal]: Reduce build and target Daevanion recommendation delay while preserving exact recommendation output.
Scope: recommendation engine and focused regression/performance checks. Adopt the existing pending per-iteration score cache only as part of this authorized speed task. Exclude account settings, points/growth UI, and all other pending changes.
Input/output: same catalog/plan/target must produce identical full plan or ordered node list; character level, purpose, points, equipment, ascension and target changes must recompute correctly. Test all eight classes, 370/416-point cases, low/zero/excess budgets and restricted paths. No input mutation or cached state leaking between calls.
Done when: measured improvement, regression/type/build pass, PC/mobile browser checks and scoped production verification.
Authorization: user requested speed work; existing immediate deployment and no-Claude-cross-review instructions apply. Claude 불가로 Codex 임시 조율: recorded usage limit until Oct 26; no retry or review-pass claim.
Base: 5b2d266f8357ad91d707ab521006997ee945321f
Evidence: D:/CodexData/Projects/ASBC/artifacts/recommendation-speed-20261024.
Verification: pending.
Last reviewed: self review pending.
Uncommitted: baseline captured; original pending files must remain unchanged except authorized recommendation patch.
Next: benchmark baseline and optimize.

Measured baseline: templar 370 crystal + 63 Azphel, 2058ms production vs 881ms pending node-score cache. Extended scope: planner.boardBonus hot path (preserve original pending account-related edits), per-iteration skill-level reuse. No scoring weights, tie-breaking, path order, or point rules changed.

Verification: 72 golden-output hashes from production source match across all eight classes; repeated inputs after mode/level/equipment/target changes also match, no input mutation. Total measured compute 61,616ms -> 3,779ms (~94% reduction). Templar 370+63: 1,979.7ms -> 114.3ms; target subset 370: 638.2ms -> 48.3ms. These are local Node timings, not network or mobile-device claims. Purpose, target-path, budget, board-effects, ascension, gear, PvP-leveling and ranker tests PASS. Typecheck/build PASS; pre-existing large-chunk/plugin-timing advisories unchanged.
Browser: PC 1440x900 templar 370/416/0/370 updates correctly, UI action-to-results 381/367/228/370ms including debounce/tool overhead. Official WANN fetched successfully, preview opened in 300ms; 370 of 416 general points plus 60 Azphel. At mobile 390x844 Triniel shows 65 priority +13 later, document width375=scroll375. Changing budget closes preview in existing deployed UI; reopening at114 recomputes correctly (114 use, 25 priority+39 later on Nezekan). The unrelated pending preview-persistence UI patch is excluded.
Preservation: all235 other pending files unchanged, planner/package previous changes exactly retained. Initial line-diff comparison for package failed because both commands share a single JSON line; reversing only our inserted test command yields the exact original bytes.

Final local browser checks: mobile Arwyn official profile returns416 general+78 Azphel; preview114/63 computes114/62 and changes node selection from WANN. Mobile30 switches to leveling with111SP/8stigma/76crystal, 12skills. Rapid114->370->416 updates only latest416 result. PvP->PvE updates and preserves budget. No console errors. Screenshots saved. No real-device CPU throttling or network-speed improvement claim.
Source review: only remove repeated work; profile weights, path/tie order, final skill allocation and point rules unchanged. Node/skill caches reset after every selected path and for every invocation. No worker, persistent/global cache, dependency or API change. Deploy pending.
