# ASBC security hardening 2026-10-31
Owner: Claude allocation/review; Codex investigation, implementation, verification.
[Task Goal]: Identify and fix evidenced security problems across ASBC while the user checks the UI; preserve unrelated edits and user data.
Scope: Steam authentication, sessions/cookies/CSRF, account ownership, public build input/XSS, proxy/external fetch/SSRF, upload/OCR parsing, API request/rate bounds, secrets/logging, dependencies, deployment settings and backup restore evidence. Shared backend code is inspected for ASBC-reachable impact; unrelated portfolio behavior preserved.
Base commit: 34eed164ab66b91fb812a982e35fa1592ee88cb3 (remote deployed main). Primary checkout has 302 unrelated pending paths and is not edited.
Expected: valid existing users/builds/settings continue; invalid/replayed/wrong-owner/unsafe-origin/malformed inputs rejected; no secrets in browser bundles/logs; fail safely on external errors; verified dependency findings addressed without unsupported major upgrades.
Failure cases: auth bypass, XSS, exposed credentials, CSRF, session theft, IDOR, unbounded request growth, SSRF, broken login/migration/sync, backup cannot restore.
Verification: complete for scoped implementation; full backend105 + final scoped regression yields107/30 suites, zero failures/errors/skips; frontend46 suites, typecheck, both builds, backend package, PC/mobile isolated browser checks passed. Security negative tests run locally/isolated DB, no production attack traffic, no real user deletion or password changes. Read-only low-volume production headers/config checks only until reviewed release.
Done when: inventory and findings have evidence/severity, fixes have regression tests and readonly peer review, remaining limitations accurately recorded. Do not claim exhaustive safety or invent test completion.
Last reviewed: Claude final read-only PASS at 2026-10-31T02:30:06Z, scope[], no blockers; prior narrowed review also PASS. Timeout review not counted.
Uncommitted: only existing collaboration logs at start; user preview remains intact.
Next: execute the now-authorized scoped release: main commit/push, rollback backups, backend then frontend, production validation.
Blocker: none.


## Current implementation / review handoff 2
See artifacts/security-hardening-20261031/security-findings.md (absolute: /mnt/d/CodexData/Projects/ASBC/artifacts/security-hardening-20261031/security-findings.md). Cookie migration is included because user explicitly requested resolving security concerns, and is being independently reviewed/tested before release.

- Review handoff2 timed out at600s, status143, no stdout/stderr; no PASS claimed. Narrowed one permitted retry to security-critical implementation files. Builds passed; full frontend46 suites passed. Fixed2 obsolete HTTP mocks before rerun.


## Final verification and handoff
- Implemented blank-key rejection, production startup guards, admin auth/TOTP safeguards, trusted-address limits, request/response bounds, generic errors, HttpOnly cookie/CSRF/legacy-session migration and per-browser prior-session revoke, account-epoch/cross-tab isolation; compatible dependency patches and 9-language privacy updates.
- Backend full105 passed, then latest focused5 classes passed; cumulative107 tests/30 suites, zero failures/errors/skips. Frontend46 suites/typecheck/ASBC and portfolio builds passed. Backend package and diff whitespace check passed.
- Final readonly Claude review PASS in tasks/collaboration/runs/asbc-security-final-review-20261031-1793413591287/reply.txt. No further handoffs.
- Isolated PC1280x720/mobile390x844 auth migration/reload/settings/cross-tab logout verified. No live Steam login roundtrip yet. Final2 server changes validated by focused tests after browser testing.
- Production application remains34eed164; no source commit/push/release. Only backup permissions narrowed operationally (3 old files0644 ->0600). Separate private restore passed20 tables/0failed migrations; no production DB changes.
- Primary302 unrelated pending paths retain identical hashes/status/HEAD. Task QA tabs94/95/96 closed and fixture servers stopped; user preview4207 unchanged.
- npm production0 advisories;6moderate dev-only ESLint/minimatch chain entries remain without compatible fix. RuntimeOSV2 conditional Spring view advisories remain; app does not use those features. Boot4/Spring7 migration deferred, not forced.
- External production HEAD checks blocked by Cloudflare403; no claim of real response-header verification from them. No full Git-history secret scan or external penetration test claimed.
- Full report/release manifest/JAR digest/screenshots: D:/CodexData/Projects/ASBC/artifacts/security-hardening-20261031/.

## Production release authorization
2026-10-31: user explicitly approved “이번 보안 변경만 운영에 배포” in reply to the 44-file main commit/push + server/web deployment question. Preserve all302 unrelated primary paths; no extra feature work. Final Claude PASS and tested source hashes verified before release. Detailed live release result is kept in D:/CodexData/Projects/ASBC/artifacts/security-hardening-20261031/release-result.json to avoid a self-referential commit.
