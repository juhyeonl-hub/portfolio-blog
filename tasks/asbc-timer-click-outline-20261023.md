# Header timer pointer focus
Owner: Codex / single writer.
[Task Goal]: Remove the outer focus rectangle when clicking or dragging the header timers.
Scope: event-timers.tsx mouse pointer entry and globals.css header-only focus. Keep keyboard focus indication and native touch scrolling; dedicated timer page unchanged.
Expected: pointer clicks/drags show no outline, including immediately after keyboard focus. Tab focus remains visible; ArrowRight and mouse drag continue scrolling.
Base: 2d792e8d83a665801b940a08e875cbaec8b3d721. Existing pending files are hashed and excluded from release.
Authorization: user asked to deploy these small UI fixes immediately; no-Claude-review preference persists.
Claude 불가로 Codex 임시 조율: previously confirmed usage limit until Oct 26; no retry and no cross-review pass claim.
Evidence: D:/CodexData/Projects/ASBC/artifacts/timer-click-outline-20261023.
Verification: pending.

Verified: production build PASS (existing chunk-size/plugin timing warnings only). Preparation command initially outlived its wait window; early build could not find vite, then succeeded once dependency symlink preparation completed.
Browser 1440x900: keyboard Tab focuses strip with 2px visible ring; ArrowRight scrolls 0 to 40. Pointer click clears ring even after keyboard focus. Mouse drag scrolls 40 to 340; capture state clears on release; no outline. Mobile 390x844: click has no outline; document width 375 equals scroll width. Dedicated-page CSS/behavior untouched.
All 212 pre-existing dirty/untracked file hashes are unchanged. Isolated build includes only HEAD plus these two source edits.
Typecheck:shadowcraft PASS. Ready for user-authorized immediate release.

Production: source ff46e801bba7aad9597494e25622f27dd5c23cca pushed to main; deployed https://643b3a7d.asbc-4c9.pages.dev. Canonical https://asbc.app/ returns 200; four entry assets match the tested build hashes. Deployed pointer click after keyboard Tab leaves outline none, no focus-visible rectangle. Screenshot production-pc.png; hash evidence production-verification.json. Final 212 unrelated pending files unchanged. Temporary preview/tabs stopped. Complete.
