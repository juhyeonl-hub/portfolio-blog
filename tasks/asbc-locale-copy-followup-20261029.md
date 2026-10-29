# Locale copy follow-up — 2026-10-29
Status: COMPLETE. Owner: Codex implementation/browser QA/release; Claude readonly coordination/review.
[Task Goal]: Finish reproduced timer sentence and transaction-count wording issues in fr/de/es/pt-BR/ru; release only the scoped changes.
Scope:16 exact fields in frontend/shadowcraft/lib/data/ui-translations.json plus task/brief documentation. No runtime, math, game-data, timer schedule, account, storage or API changes.
Base commit:8f79930e929b964ccafa148b8bdb919467fb89fe. Source commit:e7c26c8746667bd86994782f1911efd256fa7cf8.
Done when: Natural composed timer paragraph, correct pin labels and count-neutral transaction headings; PC/mobile checks, peer review and production release. All satisfied.

Changes: FR/DE/ES sentence double periods removed; ES ellipses/invisible spacing removed; DE fragment made a full sentence; PT redundant English Pin content removed. FR pin label no longer says scheduling; DE/ES/PT pin labels localized. All five history headings use Label: count rather than grammatically wrong singular/plural combinations. Placeholders and all other dictionary values preserved.

Verification: Production baseline confirmed5 composed paragraphs and5 one-record headings. Final local10 timer and50 history cases passed; after deployment the same60 cases passed. Widths1440x1000 and360x800. Timer checks include no overflow, exact translated pin labels, toggle/cancel preserving saved values. History checks compare0/1/2/5/21 displayed counts with actual expanded rows;21entries survive reload, then undo to0 and remove own QA book. No account data used: mutable QA ran signed out on the exact production deployment origin.
Nine check results PASS: event-timers, boss-timers, trade-calculator, trade-workbench, localization, typecheck:shadowcraft, build:asbc, test:seo, final localization rerun. Existing bundle-size/plugin timing warnings only; an initial negative wall-clock duration was not used as correctness evidence.
Last reviewed:Claude relay2 PASS (2026-10-29T14:53:31.342Z, exit0/status0/errornull/scope[]). Reviewer inspected exact16fields,3call sites and recorded evidence; did not independently run browser/tests. Evidence-based expansion from original speculative3fields explicitly accepted.
Last verified:Production60cases plus canonical asset confirmation.

Release: Source integrated into main, pushed normally and Cloudflare Pages deployed with Functions at https://d7ccfc16.asbc-4c9.pages.dev. Canonical https://asbc.app and the deployment both load /assets/asbc-bpNWtUlR.js. Final docs-only follow-up needs no additional frontend deployment.
Preservation:Primary302pending paths/statuses retained;300 unrelated paths byte-identical, brief append-only and exactly16 dictionary fields semantically merged while proving all other fields unchanged. Final docs integration preserves302again. No reset/stash/clean or broad staging.
Cleanup:Own local and production QA books removed, IAB viewport reset and owned tabs closed, local preview stopped. Previous Chrome QA tab confirmed already closed, Chrome viewport reset succeeded. No unrelated browser window touched. Original canonical account/locale untouched. 57evidence files adopted to D/ASBC and SHA256 checked; exact own HomeSphere staging removed.
Limits:Actual browser at desktop/mobile viewports, not a physical phone and not a new Chrome journey. No claim of all-game translation completeness or independently verified game schedules.
Uncommitted:No task source changes; unrelated primary302pending and excluded collaboration records preserved.
Next:None required for this task. Blocker:None.
Evidence:D:/CodexData/Projects/ASBC/artifacts/locale-copy-followup-20261029; translation-changes.json, source.diff, review-input.json, browser/production-timer.json, browser/production-history.json, production.json, cleanup.json, evidence-manifest.json.
