# Daevanion shop completion controls
Owner: Codex implementation / Claude read-only review
Scope: ordinary Daevanion Shugo50/Nightmare50 completion helper, plan persistence, account schema, translations and focused tests. Excludes unverified NPC100 and other changes.
Done when: 316/366/416, repeated toggles no double count; manual total requires explicit replacement; partial purchases can use total input; level change recomputes baseline; character changes clear purchases; save/reload/sync schema work; PC/mobile usable.
Base commit: 99d9a32d9d8f3eb28b534559b8f76c5a03c3b110
Verification: PASS typecheck, full test:shadowcraft suite (including new purchase suite), 8-language localization, production build; backend 125 tests, 0 failures/errors/skipped. First full-suite UI loader failure resolved by transpiling the real new child component; final entire suite passed.
Last verified: 2026-11-01 PC 1280px and mobile 390px browser: 316 -> Shugo366 -> both416; manual394 unchanged until explicit replacement; cancel keeps394; reload preserves flags and416; level36 both200 then45 both416; recommendation applies416; ko/en interactions and all8 translations no missing Korean/overflow. Physical Android/iPhone deferred by user; not claimed tested. Live account data unmodified; persistence/sync covered by automated frontend and backend roundtrip tests.
Last reviewed: Claude read-only PASS, no blockers, run asbc-daevanion-shop-checks-20261101-review-1793545319998. Source-only review; Codex ran tests and browser checks. Minor future note: explanatory baseline316 text should track any future point-data change.
Findings: purchase completion cannot be inferred from equal totals; no flags guessed. Public links retain numeric total but omit personal purchase history.
Sources: https://aion2.gg/database/daevanion ; https://allthings.how/aion-2-how-to-get-more-daevanion-crystals-100-gear-score/ ; NPC100 deliberately excluded (no known live location).
Uncommitted: scoped implementation, baselines in ASBC artifacts/shop-points-20261101
Next: scoped commit/push and backend then frontend release under standing small-change deployment instruction; post-release health/assets/browser verification. Artifacts: ../artifacts/shop-points-20261101. Recommendation selection remains a separate explicit action; purchase checks change the available total, not purchased game state.
Blocker: none
