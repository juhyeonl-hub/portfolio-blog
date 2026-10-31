# ASBC portal refinement
Owner: Codex implementation; Claude allocation and readonly review
[Task Goal]: Apply the user’s comprehensive hands-on feedback to the unpublished Metaroad layout and build workflow; audit Steam/account security and game-data freshness without unverified game claims.
Scope:
1 Rename character build finder to character search; one login action.
2 Home remove mutable selected-class CTA, create branded visual; move population to dedicated Game tools page.
3 Build: clear source/purpose/direction before allocation; show recommendation origin, apply action attached to point/purpose changes; order Daevanion, skills/specs, macro/hotbar, operation, gear, storage; remove redundant default-share workflow while preserve intentional custom shares and existing links.
4 Daevanion fit board tabs+nodes in viewport, larger legible icons, responsive inspector, search effects with visible highlights; investigate Ariel and implement validated automatic update path with last-good fallback, never invent graph/costs.
5 Skill readability/Korean font and concise dialogs. OCR explicit crop-before-read with visible selection and usable touch controls.
6 Macro actual 4-row quickslot visual plus adjacent macro sequence; no invented validated combat sequences. Explain field vs boss use/limits.
7 Ranker equipment hover plus keyboard/touch fallback, own same-slot comparison when linked, ranker-only otherwise; skill rows fixed game order; clearer consensus branches and recommendation selection at beginning.
8 Square full-fit map; unknown-faction timer explanation; Korean database search; trading-tool improvement/contact notice.
9 Remove only two agent-created localhost Layout QA saved builds; no other user drafts.
10 Read-only security audit: Steam OpenID/callback/state/nonce, session cookies/CSRF/CORS, account data/object authorization, XSS/uploads/proxy/SSRF/rate-limits/secrets/dependencies/security headers; fix proven issues with regression tests and peer review. No auth credentials/settings changes, no production attack traffic.
All9supported locales, PC/mobile direct UI verification, preserve primary302unrelated paths and existing layout work. Release authorized by the user on 2026-10-31: 운영버전에 반영 해. Commit/push only this layout/refinement scope and deploy backend/frontend after final checks.
Done when: requested UI flows are concrete, data claims have sources, security findings have evidence/severity and fixes or explicit limitations; tests and desktop/mobile checks recorded.
Expected: no hidden prerequisite buttons, board node text searchable in current locale, desktop hover and mobile tap work, no lost drafts, update failures keep last-good catalog.
Failure cases: stale catalog/new boards silently omitted, incompatible board IDs/costs, crop misalignment, hover flicker, duplicated navigation, text clipping, privilege escalation or login replay.
Base: fe521400a957583a5ae228ea5002bae9c41d6576 + previous unpublished layout.
Verification: 46 frontend suites, typecheck/build and 86 backend tests PASS; direct PC/mobile checks recorded below
Last reviewed: Claude final and UI polish review PASS, 2026-10-31
Uncommitted: prior layout preserved
Next: authorized isolated-worktree release; backend then Cloudflare Pages; production checks.
Blocker: none

## Release preparation — 2026-10-31
Implemented requested portal/navigation/home/board search+fit/Ariel/OCR crop/quickslots/operations/gear hover/database/population/trade guidance. Existing stable section links and manual/share schemas retained. Exactly two exported localhost Layout QA saves removed; no product deletion migration. Original local Templar plan backed up in artifacts; temporary Ariel 10 requires UI restore after QA.
Verification: all 46 frontend script suites PASS; 72 approved five-board recommendation hashes unchanged; dedicated eight-class Ariel separate-budget tests PASS; typecheck/build PASS. Backend targeted Steam/member/public-build/CORS/board suites PASS; direct Java HTTP source check PASS. Upstream all eight source pages decoded as literal data without executing code. Installed Steam Korean-name extraction matched 9,307 items/280 skills; English fields unchanged. Nine locales populated, PC/mobile direct flow QA partly complete, final pass in progress. No production changes yet.
Security: removed wildcard Vercel and default localhost CORS (explicit local-dev opt-in retained), Pages CSP/anti-framing/nosniff/referrer/permissions headers added. Existing external Google fonts specifically allowed; OCR remains local with same-origin workers/language files. Steam verifier/state binding, bearer auth, owner-only account/public-build mutations checked by existing tests. No upload handler found behind legacy /uploads permit rule. ClientAddress already ignores proxy headers without a matching secret; deployment config presence still to be checked without exposing values. This is scoped review, not a penetration-test or blanket safety guarantee.
Automatic updates: fixed public-source URLs, no credentials/redirects/JS evaluation, 5 MB streamed limit, timeouts, strict JSON/static AST, schema/cost/ID checks, last-good fallback, old-client schema1 filter. Periodic server job starts only once deployed; changes flag recommendation reviewRequired. Newly removed IDs/new unknown skills require review instead of corrupting saved plans.
Artifacts: D:/CodexData/Projects/ASBC/artifacts/portal-refinement-20261031 (baseline, all-checks, backend logs, source audit, original-plan backups).
Next: readonly final review; resolve findings; remaining direct UI verification and local plan restoration; scoped release, database/JAR rollback backup, backend then Pages deployment; production checks.


## Final release checks (2026-10-31)
- User authorized production release. Claude core final review and subsequent five-file UI polish review both PASS (execution status 0). No blocking findings. Four automatic handoffs used; no further handoffs.
- All 46 frontend suites passed; final localization, portal regression, typecheck and production build passed after the polish.
- Full isolated backend run: 86 tests, one outdated CORS expectation (localhost now deliberately denied by default); updated only that test expectation and reran CORS coverage. Other 85 tests passed. Runtime security change was covered by the core final review.
- Direct desktop/mobile browser checks: actual ranker gear hover/pinned mobile dialog; different ranker skills; crop-before-read and cropped OCR under production CSP; Korean-name search in Korean and English (25 Asvata results); square map; standalone population page; one mobile login. Existing Templar plan restored through import; library contains no retained QA entries.
- Release strategy: publish only manifest-listed changes from the isolated worktree to remote main. Primary checkout stays at its prior local HEAD with all 302 pending paths byte-for-byte intact; home-panel overlap is not rewritten. Future work should use the deployed isolated checkout or reconcile primary deliberately.
- Recommendation source is disclosed; unverified class macro sequences and game values are not invented. Automated board refresh is literal/validated, fixed-host, bounded and retains last-good data on failure; new/changed data is marked for review.

- Final CORS rerun passed; cumulative backend reports: 86 tests, 0 failures/errors/skips. Server JAR compared against deployed JAR: exactly 18 scoped classes/resources, dependencies unchanged. Production localhost CORS disabled, no broad hosting wildcard, trusted proxy secret present (values never logged). Final mobile OCR: 82/100, crop wrapper matches rendered image; Templar export exactly equals original backup and prior Assassin selection restored.
