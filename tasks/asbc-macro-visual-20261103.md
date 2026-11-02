# Macro visual guide correction
Owner: Codex implementation / Claude allocation and review
Scope: macro guide, layout helper, CSS, translations, focused validation.
Done when: AION2 mode explicit; fixed left mouse not assigned to another key; macro input order illustrated with icons and key badges; relevant tests and responsive browser checks pass.
Base commit: b715d301f82b5721e52fb02e318a57987e943081
Verification: focused 8-class macro test PASS; typecheck PASS; lint/postlint PASS; eight-language localization PASS; build:asbc PASS; SEO PASS. Browser PASS:960x1032 desktop,430x932 mobile, no overflow/missing icons, mobile details hidden. Final key priorities rechecked; all checks rerun PASS.
Last verified: 2026-11-03
Last reviewed: macro-visual-20261103-final-review-1793660988597 PASS (finished/status0/error null/scope[]); reviewer traced final5–8 layout and LMB handling.
Findings: user confirms AION2 mode. Screenshot Ranger fixed LMB = 14020000 (저격). Existing slot-0 bindings identify other fixed skills; Templar generator separate. Allocation's claim that all fixed skills were excluded only applies to Templar. Preserve existing fixed-key macro steps for other classes (user screenshot also includes LMB input), but remove fixed skills from movable slots. No universal 10ms assumption. Official PC guide link/search returns no content; mode basis uses explicit user confirmation. No gameplay/DPS validation claim.
Uncommitted: scope above; existing release log and collaboration files preserved.
Next: ready for a separately authorized release; no commit/push/deployment performed.
Blocker: none. Deployment not included in this new request.

2026-11-03 steering: user wants macro columns on5–8, direct-use skills at front. Added manual priority1,2,3,4,Q,E and automatic5+. Ranger now5,LMB,6; Templar5,6,5,6. Review run1793660482940 canceled for changed user scope, no PASS claimed; verified PID346900/Claude exited before clearing own stale lock. Existing fallback purpose missing translation fixed.

Final: final-review PASS. Reviewer asked to verify row-label positioning: inherited portal-refinement.css .slot-row-number is position:absolute; verified visually aligned0–3. Existing point lookup/mobile/Daevanion sources untouched. Proof and source hashes: D:/CodexData/Projects/ASBC/artifacts/macro-visual-20261103/verification.json; desktop.png; mobile.png. Build40.78s and SEO PASS. All modifications remain uncommitted.
