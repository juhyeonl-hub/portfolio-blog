# Beginner equipment guidance
[Task Goal]: Explain selected-item growth, option reasons and resource-aware next steps without unverified game mechanics.
Owner: Codex. Claude 불가로 Codex 임시 조율: recorded usage_limit until Oct26 14:00 Helsinki; no retry.
Scope: my-ranker-comparison, equipment-advice and targeted tests. Preserve all previous local changes including guide refresh.
Done when: actual/missing options, purpose changes, item changes and resource constraints show cautious guidance; PC/mobile usable; type/lint/build pass.
Base commit: b7cab2c
Inputs: actual item rolls and explicit local user preferences. Outputs: presentation only, no plan/auth/storage mutations. Unknown options remain unknown; no probabilities, numerical upgrade targets or operation-order claims.
Verification: pending
Last reviewed: self review pending; no cross-review claimed.
Uncommitted: this task plus existing excluded changes.
Next: implement and browser verify. No commit/push/deploy requested.
Blocker: none.

## Verification 2026-10-22
Typecheck/lint/equipment-advice/character-comparison PASS. ASBC build PASS (11s), bundle-size and plugin timing warnings. git diff --check PASS. 2710 pre-existing files outside scope hash-identical, including previous guide-refresh changes.
Actual comparison component tested at PC1440x1000/mobile390x844 with labeled synthetic item responses (not private account): purpose changes clear candidates, resource flag updates advice, slot changes reset preferences, missing actual options stays unknown. Mobile readable stacked controls; PC no horizontal overflow.
New file equipment-guidance.css removes nested scrolling and improves mobile readability. New Korean copy uses existing source-language fallback; other-language translations not included.
Evidence: D:/CodexData/Projects/ASBC/artifacts/beginner-gear-20261022/{pc.png,mobile.png,build.log,before-sha256.json,verify-server.mjs}. Fixture is outside release source. First fixture startup had cwd/esbuild errors, resolved via Vite virtual modules with no dependency changes.
Last verified: 2026-10-22. Last reviewed: self only. No commit/push/deploy. No existing unrelated changes edited. Automatic approval quota interrupted final checks; user continuation allowed completion. Temporary server session no longer exists.
Next: user-directed release if requested.
