# ASBC trade profit calculator
Owner: Codex. Claude 불가로 Codex 임시 조율: known usage_limit until Oct 26 14:00 Europe/Helsinki; no retry.
Scope: standalone trade calculator, sidebar route, exact integer calculation, bundle comparison, translations and tests. Preserve all existing changes.
Done when: buy/sell/tax/quantity/fees yield correct break-even and target prices; PC/mobile-width verification and scoped production release pass.
Base commit: 6cda309f676b7b35485940ff5ace3a46b50d3025
Verification: PASS strict TypeScript, configured JS ESLint, localization (46 screens), navigation routes, exact trade arithmetic (120 independent oracle cases), isolated production build. Browser desktop and 390px mobile: instant price updates, loss state, minimum/target buttons, fees, remainder, invalid zero quantity, 100% tax, menu navigation and reload persistence; English layout also checked. No horizontal overflow.
Last verified: baseline captured before edits; D free 178 GB.
Last reviewed: no Claude review available; standing user request for direct deployment.
Findings: supplied game screenshot shows current tax 10%; official search did not establish registration fees or rounding. Defaults must be explicitly labeled assumptions, not game rules.
Uncommitted: existing globals.css/home-panel.tsx/ui-translations deletion plus existing untracked files preserved in baseline.
Next: complete.
Blocker: none.

Production verification: source 8cc9dd15e1c41c70f813bf5c11e635485b983bb5 pushed to main; Pages https://48b77dfa.asbc-4c9.pages.dev deployed. Canonical asbc.app HTML and 9 entry/calculator assets byte-match isolated build. Actual Chrome PC (958px/document943) and IAB mobile viewport (390px/document375) verified default 500,000 profit, PC sale150000->160000 produces1,400,000, mobile bundle25->50 updates instantly. Test drafts restored to the 130000/150000/100/25 example. No physical-phone test. Unrelated tracked and untracked baseline files preserved; translation deletion remains unstaged. Backend unchanged. No Claude cross review. Screenshots and detailed evidence in D:/CodexData/Projects/ASBC/artifacts/trade-calculator-20261025.
