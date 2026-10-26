# GreenOrc budget-fit ranker apply, edit and save — 2026-10-27

## Goal / authorization
Verify production GreenOrc EU Ludra Templar: ranker Daevanion within personal points → apply → edit → named save → reopen on desktop and mobile. Fix beginner friction and deploy only this scope, preserving unrelated changes and original plans. Current user explicitly authorizes deployment.

## Owner / base / scope
Claude coordinated read-only successfully (execution status 0, error null): Codex implements and verifies; Claude reviews exact isolated source before release. Base main/origin: eed13921243287ab6c39fa057b3a6e8d7f313551. Reuse isolated D worktree ranker-visual-20261026. Primary pending-file baseline: artifacts/ranker-apply-20261027/baseline.json (255 hashes).

Own ranker-builds UI/helper/tests, ranker-boards shared guide input, scoped ranker-comparison-text and ranker-visual CSS as needed. Preserve recommendation algorithm, plan memory, build library, page apply/undo callback, global translations and unrelated work. Shared guide prop and localized follow-up links are bounded additions to Claude's proposal; persistence is not changed.

## Observed failure / expected output
Production WANN 416 ordinary /60 Azphel, GreenOrc budget316 /0: guide displays316 /0 subset, but Apply checks raw416 /60 and is disabled. Expected: shown guide nodes equal applied nodes; full raw target separately available only if affordable/unlocked. Preserve character, equipment, base skill investments and existing eligible specializations. Never infer hidden ranker investments.

## Failure cases / verification
Unknown identity, failed/unknown/disconnected/closed boards must reject. Separate ordinary/Azphel budgets, low level, zero/low/full points, target switch and budget changes, spec pruning, immutable preview and no unrelated plan changes. UI: desktop/mobile normal apply, edit, named save, reload/reopen, exported-plan equality; backup original via UI and restore it. Signed-out storage is local to each browser; no cross-device synchronization claim.

## Progress / actual checks
- Production bug reproduced in Chrome; no plan mutation. Original export/save temporarily blocked by extension UI; user informed (no need to close other windows).
- IAB original GreenOrc plan named and exported before mutation: Before ranker apply · GreenOrc · 2026-10-27, 5 planned nodes; original file retained in task artifacts. Chrome plan differs (98 nodes), so preserve independently.
- D free163GB before work. Source edits not yet started at task creation.

## Review / release / next
Pending implementation, meaningful tests, PC/mobile UI verification, exact-source Claude review, scope-only main/push/deploy and production confirmation. No review pass or deployment claimed yet.

## Implementation and verification completed before review
- Shared fitToBudget path validates the full official target before selecting the same recommendation nodes displayed by RankerBoards. The existing specialization-pruning path is reused. No recommendation, storage, page callback or library code changed.
- Preview now shows actual ordinary/Azphel costs; zero-point/no-paid-node apply disabled. Full allocation has a separate guarded action only when different. Success links use existing hash routes to edit Daevanion / save a named copy. Guide remains selected after budget apply.
- Typecheck and full test:shadowcraft exit0. Added 56 cases across8 classes/levels/budgets: guide==apply, identity/data validation, connected unlocked target nodes, separate currencies, no mutations or fabricated specs. Existing data tests pass.
- build:asbc exit0 (39.78s); existing chunk-size/plugin timing warnings only.
- Actual local desktop1440×1000 EN: WANN416/60 → guide316/0 → apply232nodes → remove1point leaf →231nodes/315points → named save → undo exact original JSON → reload and reopen named copy → complete exported Plan exactly equals edited Plan.
- Actual local mobile390×844 KO: points316→370/10→0/0→370/10 update immediately; zero apply disabled without contradictory availability claim. WANN268nodes changed to Bless243nodes after fresh lookup (Bless raw416/101). Apply370/10 → remove4point leaf →242nodes/366points → named save, undo, reload/reopen → complete exported Plan exactly matches saved edited Plan. No page horizontal overflow (scrollWidth375 <=390).
- Saved local QA copies and backed-up production IAB original. Production plan has not yet been modified. Chrome extension popup prevented native Chrome interaction; desktop and mobile checks above use Chromium IAB, not a claim of Chrome completion or a physical mobile device.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/ranker-apply-20261027. Cross-review and deployment still pending.

## Mobile follow-up before deployment
- Initial exact-source review: 93875ba949da59eadecba34064340b6990e66120, NO_FINDINGS0, execution0/error null, .agents/reviews/93875ba949da-1793058250181. Initial source integrated locally; not pushed/deployed yet.
- Inspecting the mobile applied screenshot revealed scroll anchoring left success/edit/save actions below the viewport. Added focus+scroll to the success block with sticky-header clearance. No calculation/storage changes. Verify visible bounds on desktop/mobile and request incremental exact-source review before release.

Follow-up verified in the browser: success/edit/save block focused and visible at 390x844 (top 394.8, bottom 602) and 1440x1000 (top 493.4, bottom 626.2). Reverting the plan immediately removes the success block on both sizes. Success tracks the current node allocation, so an undone application is never presented as still applied. Final typecheck and production build logs: typecheck-final.log / build-final.log in the task artifacts. Incremental source review pending.
