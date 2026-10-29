# Five-language macro and boss guides — 2026-10-29
Status: COMPLETE. Owner: Codex implementation/browser QA/release; Claude readonly coordination/final review.
[Task Goal]: Continue the five-language beginner journey audit on macro/key layout and boss-operation/concept simulator; release only reproduced fixes.
Scope:Four source files (page.tsx, macro-guide.tsx, new guide-usability.css, ui-translations.json) plus this task and append-only brief.29translation fields. No game-mechanic, balance, catalog, account, persistence or API changes.
Base:41e755c3096b3c6063b9ebccad87795b9bc217e6. Source:3c06d8598b9f231f681af32e99df3de3c241648c.
Done when:Actual PC/mobile browser checks in fr/de/es/pt-BR/ru, consistent reset, readable mobile actions, clear empty cells, peer review and scoped production release. All satisfied.

Reproduced:Rear AoE -> reset originally left arena back/player back but safe-rear message. Mobile360 fragmented Shadowstrike/Flash Slice names into several lines. Empty quickslots showed next-step instructions. Russian first-slot copy incorrectly implied unconditional execution; translated prose used names different from displayed English skill names.
Changes:Reset restores front/back/safe state. Pattern selection has aria-pressed and feedback is a live status. Mobile simulator buttons use2columns, whole-word wrapping and44px minimum height. Empty slots say leave empty in all8translated locales (plus Korean key);5headings shortened and15guide strings use the existing English skill names. Russian first label says Check first.29dictionary fields total; all other fields unchanged.

Validation:9checks PASS:classes, navigation, build-purpose, localization, specialization-localization, typecheck:shadowcraft, build:asbc, test:seo and final localization rerun. Initial inserted CR newline was repaired and final git diff --check passed. Bundle warning unchanged.
Local and production each:10locale/viewport combinations (1440x1000,360x800),90movement and30reset checks; macro toggle moves Ambush between repeated/manual lists without duplication;5empty slots correctly labeled; Templar fallback displays no unverified repeated layout and its boss guide remains usable.5additional mobile cases each cover localized skill tooltip, safe/damage guide names and keyboard reset. All passed, no page overflow. Russian copy refinement reran both widths; final matrix retains the newest case per locale/width. A first UI locator escaping failure was fixed to exact visible text; not treated as a product failure.
Last reviewed:Claude relay3 PASS, 2026-10-29T15:30:55.633Z, process exit0/status0/errornull/scope[]. Reviewer read code and recorded evidence; did not independently execute browser/tests.
Last verified:New production deployment10matrix+5extra cases and canonical asset match.

Release:Normal main push and Cloudflare Pages deployment with Functions at https://6d9d827d.asbc-4c9.pages.dev. Canonical https://asbc.app and deployment both load /assets/asbc-DqAHHqsk.js. This final documentation commit requires no frontend redeployment.
Preservation:Primary302pending paths/statuses retained;300unrelated pending files byte-identical. Dictionary29fields merged with reverse proof preserving unrelated entries; brief append-only. page.tsx/macro-guide.tsx had no primary overlap. No reset/stash/clean or broad stage.
Cleanup:Own temporary UI preferences restored, owned QA tabs closed, viewport reset, preview stopped. Canonical user account/locale not changed. 91evidence files copied into D/ASBC and SHA256 verified before removing exact own HomeSphere staging.
Limits:Actual browser at PC/mobile viewport sizes, not a physical handset and not new Chrome verification. Assassin full flow and Templar fallback tested, not all classes or all game translations. Existing game explanations were not independently revalidated; no new numerical or gameplay claims introduced.
Uncommitted:No task source changes. Primary302unrelated pending paths and excluded collaboration records preserved.
Next:None required for this task. Blocker:None.
Evidence:D:/CodexData/Projects/ASBC/artifacts/five-language-guides-20261029 (translation-changes.json, source.diff, source-hashes.json, review-input.json, browser/local-matrix.json, browser/production-matrix.json, browser/production-extra.json, production.json, cleanup.json, evidence-manifest.json).
