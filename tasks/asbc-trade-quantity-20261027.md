# Calculator price/quantity audit — 2026-10-27
Owner: Codex implementation/QA; Claude read-only final review.
[Task Goal]: Clarify batch totals and make changing production volume easy after auditing the live calculator on PC/mobile; user explicitly requests fixes and immediate deployment.
Base: e53d601c0000a54b22d5f0e0349614b889fea8da. Primary302 pending files hashed; reused isolated worktree clean.
Scope: app/craft-sale.tsx, app/craft-sale.css, lib/craft-sale-text.ts, lib/craft-sale.ts (new batch input helper only; pricing engine unchanged), tests/trade-workbench.mjs; task/brief. No store/schema/backend changes.
Observed live: 5254x2 +400x1, output10 retained10908 cost and showed1334 per item: mathematically correct yield, but ambiguous for production-volume changes. 6000x2+500 output1 yielded12500/15278/1250. Mobile390 invalid output0 misleadingly requested material prices. Original blank draft/qty1/output1/tax10 restored; no plans saved.
Plan: label materials as batch totals and output as yield from those materials; explicit2x/10x buttons scale material/output/extra-crafting-cost together (not prices, owned inventory, tax or per-listing fee). Guarded one-step undo; show output total with result; field-appropriate incomplete-input hints. No recipe inference.
Expected: base10908/13333/1091; tenfold109080/13332/10908 with20wood+10paper/output10. Undo restores exact prior strings; manual/external/account changes invalidate undo. Invalid/over-limit quantities or extra cost disable scaling without mutations. Preserve storage and legacy roundtrip.
Verification: existing trade math/storage/locale tests, focused batch-helper boundaries, types/build, PC/mobile live before + local after + deployment after. Browser viewport tests, not a physical phone.
Status: coordination passed; implementing scoped correction. User directly authorized deployment after fixes; no further permission needed after successful cross-review.

## Verification before final review
Typecheck, trade-calculator, trade-workbench, trade-sync, localization, diff --check, production build all passed. Real browser PC1200 (DOM1185) and mobile390 (DOM375): 5254*2+400=10908 => target10% 13333, breakeven12120; x10 => qty20/10 output10 cost109080 target13332 profit10908; undo restored inputs; prices6000/500 => cost12500 target15278; extra100+fee25 x2 => extra200 fixedfee25 output2 cost25200 target15414 profit2520. Manual price edit and second-tab price edit hide undo. Invalid output0 gives correct output hint and no stale result, scale buttons disabled. Manual output10 preserves material quantities explicitly. KO/EN/JA/FI displayed. At320 viewport Finnish only existing common footer nav overflows (out of calculator scope); standard390 fits. Console errors empty. Local inputs restored. Production pre-audit inputs restored.

## Review 1
Claude completed read-only review (exit 0, execution status 0, error null, scope []). Confirmed math/undo/schema/isolation; found duplicate settings hint and English singular grammar. Both fixed narrowly: suppress only the duplicate checkSettings note, and use count-label summary in English. Focused revalidation and delta review pending.

Delta review hit the 120-second execution limit with no reply. No source change or scope violation. One retry uses 300 seconds under the shared timeout policy.

## Final validation and release preparation
Focused retry review returned NO_FINDINGS with process exit0, execution status0/errornull/scope[]. Both minor findings resolved. Final typecheck, trade-workbench, localization, diff check and production build pass. Real mobile recheck confirmed one settings hint and distinct output/settings hints when both invalid. Source/test changes are limited to five files. Review execution records and screenshots are archived under D:/CodexData/Projects/ASBC/artifacts/trade-quantity-20261027. Source commit and deployment follow the current explicit user authorization.

## Production closeout
- Source commit: 190b6b9345ff953984888d218181526df74fa2bf; pushed main. Deployment: https://ef4a27da.asbc-4c9.pages.dev .
- Live https://asbc.app/#/trade verified in browser at PC1200 and mobile390 (actual DOM1185/375), eight calculation/scale/undo/invalid-output cases passed; no horizontal overflow in those viewports or console errors. New asbc-odMfqmq0.js and trade-calculator-DCHJL1rZ.css loaded. Mobile is browser viewport verification, not a physical handset.
- Production/local draft inputs restored exactly; owned tabs closed and viewport override reset. No saved plans created.
- Existing 301 pending file hashes preserved plus original mixed PROJECT_BRIEF content preserved with task-only appends (302 baseline files). Evidence: D:/CodexData/Projects/ASBC/artifacts/trade-quantity-20261027/verification.json .
- Narrow320 Finnish common footer navigation overflow is outside this calculator change; calculator controls fit and390 page fits. No unrelated footer/global styles changed.
