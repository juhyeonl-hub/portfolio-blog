# Manual skill usage and macro method guidance
Owner: Codex implementation; Claude allocation/review
Scope: manual skill cards, PvE rotation examples, guide-only comparison of current manual-assisted style and attack+buff macro grouping. No new game macro preset, no saved build mutation, no deployment requested.
Done when: manual keys/icons match current grid; usage conditions and flow visible; guide-only comparison honest; all8 class and responsive checks pass.
Base commit: 05e7815bd6965628ccdc97a1d7848dccaab9701a
Last reviewed: manual-guide-20261103-review-1793662631208 PASS; status0/error null/finished/scope[].
Findings: reuse82 curated manual-purpose texts and existing profile.rotation read-only. Ranger conditions checked against shipped skill-descriptions English text (Precision/movement/charge/buff durations/trap/CC release). New hold advice is contextual recommendation, not measured DPS. Online gaming.tools and official guide fetch unavailable; no claim fresh in-game validation. PvE-only rotation shown only purpose=pve; missing rotation/pvp/leveling shows honest fallback.
Verification: macro-layout and manual-guide tests PASS (8classes,3purposes,Assassin option); typecheck PASS; lint/postlint PASS; localization8languages PASS; build/SEO PASS. Browser PASS: Ranger8cards and PvE flow; matching1,2,3,4,Q,E,7,8keys;960x1032/430x932 no overflow or missing icons; English no untranslated Hangul; Templar PvP no PvE flow and no-macro fallback; Assassin upper row explicit separate-key note.
Uncommitted: guide files and task record; prior release/collaboration records preserved.
Next: complete local implementation; no commit/push/deployment requested or performed.
Blocker: none.

Review advisory resolution: Ranger-only hold field is intentional (existing82purpose texts cover other classes). Upper-row long keycap covered icon; after review changed display to ? with aria-label 별도 키 지정 and kept actual row/column separate-key note. Added regression assertion, reran component/localization/typecheck and final build/SEO. Browser verified final ? and fallback. Full project lint passed before this cosmetic edit; targeted TSX ESLint is ignored by current configuration, so final TSX syntax/types verified by tsc. Final JS regression file lint passed.
Last verified: 2026-11-03 Europe/Helsinki. Artifact folder: D:/CodexData/Projects/ASBC/artifacts/manual-guide-20261103 (desktop.png, methods.png, mobile.png, build.log, seo.log, verification.json). Existing macro allocation/LMB5–8 algorithm unchanged; prior point/mobile/board source unchanged.
