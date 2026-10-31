# ASBC development dependency audit remediation

Owner: Codex implementation/verification; Claude allocation and read-only review.
[Task Goal]: Remove the remaining development-only npm audit warnings without weakening lint rules or changing production dependencies and application output.
Base commit: 5a2d0e32504d4848ac5512b6254f57c9e61c9a33.
Scope: frontend/package.json, frontend/package-lock.json, frontend/tests/lint-toolchain.mjs, this task record. Preserve 302 unrelated primary-tree paths and 541 pre-existing worktree untracked paths byte-for-byte.
Authorization: user said "확인 . 다음 진행" after the prior scoped security release. Existing authorization for reviewed scoped commits/push remains; no service/web deployment is needed if production output is identical.
Done when: full and production npm audits have zero reports; file coverage/rules remain effective; existing feature/type/SEO checks pass; production lock entries and all release assets are unchanged; Claude final review passes.

Findings:
- The six moderate reports were one minimatch advisory propagated through lint dependencies, not six independent server flaws. Installed legacy minimatch 3.1.5 did not contain the described firstPhasePreProcess optimizer; no production exposure was claimed.
- ESLint 9 reached EOL on 2026-08-06. ESLint 10.14.0 itself still requests minimatch 10.x, below the advisory's patched range >=11.0.1.
- Upgrade ESLint 10.14.0, @eslint/js 10.0.1, react-hooks 7.1.1 and react-refresh 0.5.7. Pin minimatch 11.0.3 only for exact tested parents eslint@10.14.0 and @eslint/config-array@0.23.5. Do not apply this to legacy ESLint or unrelated consumers.
- The two consumers use the retained Minimatch constructor/match API. Removed makeRe/AST APIs are not used. Actual lint and behavior tests verify compatibility; this is an explicitly tested override, not an upstream compatibility guarantee.
- Revisit/remove overrides when ESLint natively takes a patched minimatch version. New parent versions require a fresh compatibility review. No npm force fix, audit suppression, global runtime/configuration change, app/backend change, or linter removal.

Verification so far:
- Original and candidate lint: identical 117 file paths, 0 errors/warnings/fatal messages.
- Regression: exact files, nested paths, Unicode/space names, dotfiles, dist/vendor exclusions, ignore negation, brace/globstar, valid JSX, unused/undefined variables, invalid syntax, conditional Hook and mixed React exports; both actual minimatch consumer resolutions; advisory-shaped preprocessing in 128 MB/5-second child processes: PASS.
- Original production package entries: 140, all identical in candidate. Candidate full npm audit: 0 reports.
- Initial test fixture incorrectly used a constant export permitted by the existing Vite preset; changed the fixture to a non-component helper export. No lint rule was relaxed. Initial build/test attempts started before candidate source copying completed and failed on missing files; rerun after preparation. The isolated frontend-only fixture also lacked backend class-profiles.json; remaining 16 feature suites ran successfully against the identical worktree frontend and existing backend metadata.

Claude allocation: asbc-dev-audit-plan-20261031-1793479949925, completed status0/scope[]. Initially suggested waiting because ESLint 10 alone retains the warning; subsequent official EOL evidence and isolated scoped-override tests justify this tested alternative, to be explicitly cross-reviewed.
Last verified: 49 feature suites PASS (first suites in isolated candidate, remaining 16 in worktree with required backend metadata); typecheck PASS; SEO 14 guides / 15 sitemap URLs PASS; build PASS; all 1,932 release-file SHA-256 hashes identical to production release 5a2d0e3; final lint 118 files (117 original plus new test), 0 errors/warnings; npm lint postlint regression PASS; npm ls valid; full and production audit 0. Node 22.22.0 / npm 10.9.4.
Last reviewed: Claude PASS, asbc-dev-audit-review-20261031-1793480942565; execution finished/status0/error=null/scope[]. No blocking findings.
Uncommitted: only the four scoped paths will be committed.
Next: scoped commit/push approved by review; commit identity recorded in the artifact release result. No runtime deployment/restart: the 1,932 web files are byte-identical and backend is untouched.
Blocker: none.
Artifacts: D:/CodexData/Projects/ASBC/artifacts/dev-dependency-audit-20261031/.
Sources: https://eslint.org/version-support/ ; https://eslint.org/docs/latest/use/migrate-to-10.0.0 ; https://github.com/advisories/GHSA-g3hv-75wg-m249 ; https://github.com/isaacs/minimatch/releases/tag/v11.0.1 ; https://github.com/eslint/eslint/issues/21463 .

The new test also runs automatically as npm postlint; no lint rule, ignore list or existing test was changed. Review source changes only in the four scoped paths; ignore unrelated untracked collaboration history.

Non-blocking review notes checked: official npm metadata confirms @eslint/js latest 10.0.1 with eslint ^10.0.0 peer support; separately captured npm audit --omit=dev command/exit/output confirms zero. See review-observation-checks.json.
