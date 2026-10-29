# Five-language guides — 2026-10-29
Status: REVIEW PASSED; scoped release in progress.
Owner: Codex implementation/browser QA/release; Claude readonly coordination/final review.
[Task Goal]: Continue the five-language beginner journey audit on macro/key layout and boss-operation/concept simulator; release only reproduced fixes.
Scope: page.tsx simulator reset/ARIA, macro-guide.tsx empty cells, new scoped guide-usability.css, 29 exact translation fields, this task and brief. No game-mechanic, balance, catalog, account or persistence changes.
Base: 41e755c3096b3c6063b9ebccad87795b9bc217e6. Primary 302 pending paths preserved; only dictionary and brief overlap this change.
Allocation: Claude relay1 success 2026-10-29T15:06:35.207Z, status0/errornull/scope[]. Author: Codex. Final review required before release.
Production reproduction: rear AoE -> reset leaves arena back/player back but safe-rear message. Mobile360 buttons break Shadowstrike and Flash Slice across multiple word fragments. Empty quickslots incorrectly show next-step instructions. Long translated quickslot headings and inconsistent skill names in guide prose make matching cards harder.
Changes: Reset restores front/back/safe initial state; selected pattern exposed with aria-pressed and feedback is a live status. Mobile action buttons use two columns, full readable words and44px minimum height. Empty cells explicitly say leave empty (all8 translated locales plus Korean key). Five quickslot headings shortened; five-language boss guide prose uses the same English skill names already shown on the cards, keeping original conditions.
Validation: Pending. Production baseline screenshots and DOM evidence in artifact browser adoption pending. QA uses signed-out isolated production alias/local preview, never canonical account data. PC1440x1000 and mobile360x800 are browser viewports, not physical phones.
Last reviewed: Allocation only. Final checks/review/release pending.
Next: Local checks, browser matrix Assassin and Templar fallback, readonly review, isolated main integration/deployment, production verification and cleanup.
Evidence: D:/CodexData/Projects/ASBC/artifacts/five-language-guides-20261029.

Russian first-slot label corrected from an unconditional execution claim to Check first, matching the source instruction and the availability check described below the layout.

Local verification:9checks PASS (classes, navigation, build-purpose, localization, specialization-localization, typecheck, final build, SEO, final localization).10locale/viewport combinations with90movement and30reset checks, macro toggle/empty labels and Templar fallback PASS.5additional mobile cases cover translated skill tooltip, safe/damage guide name matching and keyboard reset. Russian label refinement rechecked on both widths; no physical phone claim. A first QA locator could not escape a French apostrophe and was corrected to exact visible text; rerun passed. Import newline whitespace check repaired, final diff --check PASS.

Review relay2 timed out after300seconds with no stdout and empty stderr (execution.status143,failureKind timeout). One permitted retry relay3 uses compact change evidence and600seconds; no failed review is counted as PASS.

Claude readonly final review PASS, finished 2026-10-29T15:30:55.633Z (relay3, exit0/status0/errornull/scope[]). Existing continuing user authorization covers scoped main push and Pages deployment.
