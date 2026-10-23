# Timer original game icons — 2026-10-23
Owner: Codex. Base: 86df13f. Scope: timer category icons only; preserve unrelated changes.
Request: use actual AION2 game icons for compact timer cards.
Claude 불가로 Codex 임시 조율: previously recorded usage_limit until Oct 26; no retry.
Plan: verify client asset bindings; reuse unchanged original textures; PC/mobile checks, typecheck and scoped build. No commit/push/deploy requested for this iteration.
Evidence: D:/CodexData/Projects/ASBC/artifacts/timer-game-icons-20261023.
Auto-review rejected copying existing client profile because it includes an AES key. No files changed by rejected call. Use existing profile without copying or exposing keys.

Implemented: reuse unchanged original Global client boss marker for field/Abyss and original rift marker for rift. Category labels and colors distinguish field/Abyss; do not claim a distinct Abyss asset. Shugo/invasion retain existing generic icons because corresponding source assets could not be verified. Image load errors fall back to previous symbols.
Extraction: existing profile referenced a missing usmap; restored the non-secret structure file to its original temporary path, without copying/changing any key/profile. Tool then mounted 0 files from the current installed client. No further authentication changes attempted.
Verification: isolated main + two UI files typecheck and production build PASS (existing chunk/plugin warnings). Event/boss timer tests PASS. PC1440: 56 cards, four columns, 54 original boss images fully loaded. Abyss filter shows six correctly labelled cards. Switching dimension to rift loads original Rift.png. Mobile360: two columns, 345/345 document width, all numeric countdowns one line (24px); pin changed 6 to 7. Screenshots saved. All 212 prior pending file hashes unchanged. No stage/commit/push/deploy. Browser tab closed and viewport reset.

Release authorization: user said “이런거는 바로바로 배포해” after the verified UI was reported as pending deployment. Deploy these small verified UI updates directly; preserve unrelated changes. For this release: main commit/push and deploy the already tested isolated build. Prior explicit no-Claude-cross-review authorization applies; no cross-review pass claimed.
Release preflight: 212 unrelated pending file hashes unchanged, index empty, branch main, scoped source matches tested isolated source byte-for-byte.
