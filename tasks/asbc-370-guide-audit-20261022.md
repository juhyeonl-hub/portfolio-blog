# 370-point production guide audit
Owner: Codex. Claude 불가로 Codex 임시 조율; known usage_limit until Oct 26 14:00, no retry.
Task goal: validate actual 370-point production comparison on PC/mobile; improve observed clarity issues only.
Base commit: 863bed7
Scope: ranker-boards.tsx and ui-translations.json; this record. Existing unrelated files preserved.
Expected: target 416 vs own 370 recommends <=370, Azphel independently capped; clear missing points and per-board counts. No target auto-apply.
Production: entered 370 using visible point input, confirmed saved total 370, selected donBshy via official query. Actual goal416/Azphel86; recommended370/0. PC1440 and mobile390 inspected. Initial click took longer than browser action timeout; state subsequently confirmed completed (not retried).
Findings: users must subtract 416-370; all-blue Azphel lacks immediate separate-currency explanation. Added shortfall and per-board keep/add/later counts plus Azphel budget explanation.
Verification: pending. Last verified: 2026-10-22. Last reviewed: self-review pending.
Next: focused tests and local PC/mobile validation. Blocker: no private character login tested. No commit/push/deployment requested.

## Verified
- Production own 370 persisted after reload in the audit browser. Live target 416 crystals +86 Azphel. Priority cost370, Azphel0. Per-board orange/blue counts: Nezekan66/1, Zikel65/2, Vaizel53/14, Triniel76/6, Azphel0/56. These are counts, not point costs. No own linked character was available, so no green ownership comparison claimed.
- Local synthetic fixture target416+63 at own370+0: added shortfall46+63 correct; board counts match colors; Azphel all deferred with explicit separate-currency message. PC1440 and mobile390 screenshots checked. Production was audited; new copy is local only.
- PASS typecheck, lint, localization, all eight classes target-path tests (including416->370, zero budget, locked levels, connectivity, nonmutation), production build, diff check. Existing bundle size warning remains.
- All199 excluded file hashes unchanged. Only two declared source files and this task record changed; no stage/commit/push/deployment. No recommendation algorithm or saved-plan schema change.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/370-guide-audit-20261022: target-path.log, build.log,370-live.png,370-improved-mobile.png,370-improved-pc.png.
Last reviewed: Codex self-review. Last verified:2026-10-22. Next: scoped release if requested. Blocker:none for this work.

## Release authorization — 2026-10-22
User explicitly approved this verified 370-point guidance scope for main commit/push/production deployment without Claude cross-review. Earlier local-only status superseded. Review waived, not marked passed. All199 unrelated hashes unchanged.
Release candidate typecheck/lint/localization/build PASS; existing eight-class target-path PASS from audit. Scope: two source files and this record only.

## Production release complete
Source commit f0ab20cf5ab627e5cbb7d1adc00f9abdafb2134f pushed to origin/main. Cloudflare production deployment https://80415ab4.asbc-4c9.pages.dev ; custom domain https://asbc.app/ directly verified.
CUA PC1440/mobile390: saved370 preserved; live donBshy target416/Azphel86, recommendation370/0, shortage46/86. Nezekan66 priority/1 later; Azphel0 priority/56 later and separate-currency explanation displayed. Initial preview calculation exceeded click timeout but rendered correctly on subsequent observation; no duplicate click. No target plan applied.
All199 unrelated file hashes unchanged. Backend untouched. Claude review explicitly waived, not passed. Production proof: D:/CodexData/Projects/ASBC/artifacts/370-guide-audit-20261022/370-release.png. Status complete; no remaining release work.
