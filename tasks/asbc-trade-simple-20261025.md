# ASBC purchase-only trade calculator
Owner: Codex. Claude 불가로 Codex 임시 조율: known usage_limit until Oct 26 14:00 Europe/Helsinki; no retry.
Scope: purchase-only default calculator, automatic break-even/5/10/20% profit sale-price examples, optional manual sale comparison and quantity/tax/cost settings. Preserve unrelated changes.
Done when: buying price alone updates examples and results; PC/mobile QA and scoped release pass.
Base: 2fb532cff2fcaa24752051b6733265ca47e362f3
Verification: PASS strict TypeScript, configured JS ESLint, localization, original 120 arithmetic oracle cases plus purchase-only ROI/rounding/input regression cases; isolated production build. Browser desktop and 390px mobile: one default purchase field; 130000 -> 200000 updates minimum/5/10/20% examples; blank/comma input; manual sale prefill; unfinished manual draft ignored in auto mode; 1 item + 1000 listing fee -> 160000 sale price for 10% profit; reset settings retains purchase price. No horizontal overflow.
Last verified: baseline captured.
Last reviewed: no Claude review, user standing direct-deployment request.
Findings: identical unit prices and percentage tax imply equal total profit apart from per-listing fees and rounding. Do not infer sale prices or sell-through from purchase price alone.
Uncommitted: existing globals.css/home-panel.tsx/translation deletion and untracked files preserved.
Next: complete.
Blocker: none.

Production: e68e21ab9b63274f23b48d66989bac2488742420 pushed to main; Pages https://365d412b.asbc-4c9.pages.dev deployed. Canonical HTML + 9 entry/calculator assets byte-match the isolated build. Actual Chrome PC and IAB390px mobile: only purchase-price input shown by default; purchase130000->200000 (PC) and130000->100000 (mobile) immediately updates break-even/5/10/20% sale prices and profit. Restored both browser drafts to purchase130000. Browser viewport reset; temporary tabs and owned QA server cleaned. No physical phone test. Existing changes preserved, backend unchanged, no Claude review. Evidence at D:/CodexData/Projects/ASBC/artifacts/trade-simple-20261025.
