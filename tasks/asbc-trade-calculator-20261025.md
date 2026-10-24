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
Next: scoped commit, push, Pages deployment, production smoke check.
Blocker: none.
