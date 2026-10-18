# Ranker refresh and observation times
- Owner: Codex, single writer.
- Scope: bounded manual80-profile import; distinguish cached ranking/equipment comparison from selected live official detail, display timezone and response timestamp, render live skills rather than old snapshot.
- Done when: import validates all80 before atomic save; tests cover live/missing/invalid skills and refresh failure, timestamp semantics and existing UI preservation; full frontend suite/build pass.
- Base commit: 0655af4.
- Verification: pending final snapshot. Browser1440/390 success/empty/error response paths and existing8class comparisons/preparation/board copy/undo passed. Type/lint passed.
- Last verified: 2026-10-19 local.
- Last reviewed: self review; independent review not run (no storage/auth/deployment changes).
- Findings: ranking fetch time is now captured before official verification, separate completion timestamp; current official skill array cannot silently fall back to snapshot. Public data remains manually refreshed.
- Uncommitted: feature/importer/snapshot/tests/docs. Private untracked context and access-request files preserved.
- Next: finish import and validation; no automatic commit/push/deployment.
- Blocker: none.

## Completion — 2026-10-19
- Snapshot:80official profiles verified,46changed excluding timestamps. Ranking retrieval21:04:54Z and verification completion21:08:28Z on Oct18 (Oct19 Europe/Helsinki).
- Verification: full24frontend suites, typecheck/lint/build passed. After final atomic snapshot replacement, importer2tests, ranker unit suite and full1440/390 UI regression passed again. Live40-level, empty skill response,503failure snapshot fallback label and recovery tested. All86observed skill guides still cover the refreshed data.
- Last verified:2026-10-19 local. Last reviewed:self diff; cross-review not run. Existing bundle-size warning remains. No test failures.
- Uncommitted: importer/data/UI/helpers/tests/docs and this task file. No stage/commit/push/deploy; private2untracked files preserved.
- Next: user-directed review and release. Product implementation complete; no blocker.

## Release request — 2026-10-19
User '다음 진행' follows explicit recommendation for review/Git/deployment. This release is authorized; no ongoing automatic deployment policy is installed. Review base0655af4. Existing full24suite/type/lint/build and final refreshed-data/UI checks passed; no product changes since verification. Independent review and production tests pending.

## Release completion — 2026-10-19
- Last reviewed: isolated clean copy, official read-only Codex runner,0655af4→fa80609, NO_FINDINGS0. Result stored locally at .agents/reviews/freshness-release-20261019/result.json.
- Last verified: production1440/3908class regression including live40-level/empty/503error/recovery and compare/copy/undo passed with controlled responses. Separate unmocked official profile lookup displayed timestamp and26skills. No user plan applied in real lookup.
- Release:fa80609 pushed; dpl_BHumLkmgy3dpPAEH3fqnxCAnwuPd Ready; juhyeonl.dev alias confirmed. Production build passed. No product changes since validated snapshot.
- Findings: no review findings or new test failures; existing chunk warning and manual snapshot limitations retained.
- Uncommitted: only2pre-existing private untracked files after documentation commit. No private files in review/deployment snapshot.
- Next: this release complete; no remaining release action. Blocker:none.
