# Natural user messages

Owner: Codex; Claude allocation and readonly review
Scope: all 96 copy-audit findings, companion UI/error copy and eight translated locales. No calculation/persistence changes.
Done when: 96 resolved, checks/build and responsive PC/mobile verification pass, readonly review complete
Base commit: 5c5f94eee4ba4156399e5ff3b5542682a3f3e204
Verification: 45 frontend scripts cumulatively pass (stale armory copy assertion fixed and rerun); 80 backend tests pass using -DreuseForks=false -DforkCount=1 (existing shared-H2 cleanup dependencies caused the initial default-fork failure). Final localization/public-builds/armory/typecheck/build PASS; build32.72s with existing warnings. 72 local browser locale/viewport copy cases pass with no horizontal page overflow; final bundle retry path and modal switch/undo checked. Not physical-device or authenticated production testing.
Last verified: 2026-10-30; artifacts/message-copy-fix-20261030/final-verification.json
Last reviewed: Claude readonly follow-up asbc-message-copy-fix-rereview-20261030-1793383985180 PASS; original6 required and2 optional translation findings resolved. Review did not execute tests.
Findings: 96/96 resolved. 116 replacement mappings,117 companion dictionary keys with8 locales,9 inline locale arrays matched. Public-list failure branches now name the real retry button instead of exposing raw exceptions. Backend error validation acceptance unchanged.
Release: reviewed source commit f8a57f1ec93319317fe569640f9f9b4f1cfc3e1b pushed to main; all302 pre-existing pending paths preserved (299 byte-identical,3 verified reversible scope merges).
Next: no release work remains; existing shared-H2 CI cleanup conflict is a separate follow-up.
Blocker: none for implementation or verification
Evidence: D:/CodexData/Projects/ASBC/artifacts/message-copy-fix-20261030; final-verification.json, scope-verification.json, translation-reviewed.json, translation-second-pass.json and browser screenshots. Abandoned translation-drafts.json/raw batch files were never adopted; translation-reviewed.json and source dictionary are authoritative.

Release authorization: user first selected hold, then explicitly reversed it with "아니야 그냥 반영해" on2026-10-30. This authorizes the previously stated scoped main commit/push/production deployment. Existing Claude allocation and final readonly PASS reused; no product source edits after review.

Production deployed and checked2026-10-30: https://59db9745.asbc-4c9.pages.dev; canonical https://asbc.app with /assets/asbc-D6DlEzHv.js matching local SHA256. Backend92be162fd3de1ce6aa57bbb1a39f603e55b3fdafc872ba89e1bf83e0c2dae8a6 healthy after existing-service restart; DB and previous JAR backup verified.18 production locale/viewport storage-copy checks (9languages x PC/mobile) PASS; canonical PC/mobile guidance visible without horizontal overflow. These are browser viewport checks, not physical-device or authenticated save tests. Own temporary verification tab closed, viewport reset; existing user plans unchanged.

CI exception: https://github.com/juhyeonl-hub/portfolio-blog/actions/runs/41115149884 failed8 setup cases with H2 CONSTRAINT_F6A / DROP TABLE shadowcraft_public_builds. Previous run40772604960 failed7 setup cases with the same error before this scope. The additional case in this release hits the same shared DB setup. All80 tests pass with per-class JVM isolation. No unrelated CI/test DB changes made. Evidence: ci-baseline-comparison.json, backend-isolated.log.
