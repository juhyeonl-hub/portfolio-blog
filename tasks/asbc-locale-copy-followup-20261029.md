# Locale copy follow-up — 2026-10-29
Owner: Codex implementation/browser QA; Claude readonly coordination/review.
[Task Goal]: Finish reproduced timer sentence and trade-count wording issues in the five newly supported locales; release only these changes.
Scope: 16 exact fields in frontend/shadowcraft/lib/data/ui-translations.json; this task record and append-only PROJECT_BRIEF.md. No runtime, game mechanics, timer schedule, calculation, persistence, auth or API changes.
Done when: Natural composed timer paragraph with one sentence boundary, neutral transaction-count headings for 0/1/2/5/21; desktop1440/mobile360 verification, focused checks and readonly peer review; scoped main push/production verification.
Base commit: 8f79930e929b964ccafa148b8bdb919467fb89fe.
Verification: Production baseline five timer paragraphs and five one-transaction labels captured from isolated production alias. One own QA book removed. Original canonical account untouched.
Last verified: Baseline reproduction complete; edited implementation awaiting checks.
Last reviewed: Claude coordination relay1 success; final review pending.
Findings: DE/ES double period also reproduced in FR; ES has two stray ellipses plus invisible characters, DE middle fragment lacks a complete sentence, PT includes redundant English Pin content. All five one-entry headings incorrectly use plural nouns. Within the same user-approved localization task, expanded to these reproduced occurrences; final review must assess this evidence-based scope adjustment instead of earlier speculative FR/PT unchanged criterion.
Uncommitted: This task's exact dictionary edits and docs only. Primary302 pending paths preserved against SHA256 baseline; collaboration records excluded.
Next: Focused tests, PC/mobile UI QA, review, scoped release.
Blocker: None for scope. Previous Chrome QA tab remains inaccessible due to extension control; no Chrome/physical-handset verification claim.
Evidence: D:/CodexData/Projects/ASBC/artifacts/locale-copy-followup-20261029.

Visual QA additionally exposed untranslated Pin labels in DE/ES/PT and FR Programmation (scheduling instead of pinning). Corrected the four labels in the same timer-settings form; no control behavior changes. Final timer viewport matrix must be rerun after the updated build.

Local final validation: all10 timer locale/viewport cases pass sentence seams, localized pin labels, toggle/cancel restoration and horizontal fit. All50 history cases (five locales x desktop/mobile x counts0/1/2/5/21) match actual expanded entries;21entries survive reload; own QA book removed. Nine check results PASS (five targeted scripts, typecheck, build, SEO, final localization rerun). Existing bundle-size/plugin timing warnings only; one wall-clock elapsed duration is negative due to clock adjustment, not used as correctness evidence. Current final entry asset asbc-bpNWtUlR.js.

Claude readonly review relay2 PASS, finished 2026-10-29T14:53:31.342Z; process exit0/status0/errornull/scope[]. Scoped release authorized by continuing user request. Chrome inventory subsequently confirms previous owned QA tab absent, viewport override reset succeeded; no Chrome journey pass claimed.
