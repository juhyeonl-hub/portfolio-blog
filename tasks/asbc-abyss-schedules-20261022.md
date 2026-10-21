# Abyss reference-schedule bosses
Owner: Codex, Claude allocation approved/status0
Scope: add five EVENTS bosses omitted from FIELD_BOSSES catalog. Keep existing49observed/numeric pins; optional pinnedSchedules preserves old parser compatibility.
Done when: schedule/DST/settings tests, browser checks, review, authorized deploy/commit/push.
Base commit: 115b5c9
Verification: typecheck/lint/event-timers/localization/build:asbc PASS. New tests coverEU/US DST, localweekday, 5day gap, exactsecond, springgap/autumnfold and cache. Actual old parser at115b5c9 accepts/preserves new pinnedSchedules. abyss_schedules.py PASS (offline feed, separatepins, cross-tab, mobile/storagefailure). all_boss_pins.py and timer_pins.py PASS. 1890 artifact hashes matched source; mobile screenshot inspected.
Last verified: public schedule.js fetched; digest/events in shadowcraft/operations/abyss-schedule-audit.json.
Last reviewed: incomplete. Claude review run asbc-abyss-review-20261022-1792620010495 exited1, failureKind=usage_limit, no review verdict. No retry.
Findings: Watcher Kaira starts=[60,240,420,600,780,960,1140,1320] minutes eachday (01:00 anchor, NOT00:01). Nahma days[0,5] at1260; executors days[1,4,6] at1290. Days0=Sunday; regionalclock, noUTC flag. Names from EVENT_TEXT: watcher/executor Kaira use distinct _001/_002 IDs, spiritking/executor Argo likewise.
Uncommitted: task changes only, unrelated untracked files preserved.
Next: Claude resumes cross-review when available, then authorized deploy/commit/push. Alternatively explicit user override of cross-review requirement is needed before dependent release.
Blocker: 교차 리뷰 대기 — Claude usage limit (reported reset 2026-10-26 14:00 Europe/Helsinki). Claude 불가로 Codex 임시 조율. User cooperation rule requires storage/deploy changes to wait for counterpart review. Production unchanged, no commit/push/deploy for this task.
Artifacts: D:/CodexData/Projects/ASBC/artifacts/abyss-schedules-20261022/dist-asbc (asbc-CnUcrDGn.js). Evidence: D:/CodexData/Projects/ASBC/evidence/abyss-schedules-20261022.

Release authorization 2026-10-22: User explicitly approved Codex-only verification for both Abyss bosses and equipment comparison, selective commit/push and production deployment. This overrides the cross-review wait for this release only; no Claude review pass is claimed. Prior Blocker/Next statements above are superseded.

Release completed 2026-10-22: feature commit f6bcf6d pushed to origin/main. Backend mvn package passed all 66 tests (0 failures/errors/skips). Verified DB backup portfolio_blog_20261021T222651Z.dump; rollback JAR ~/portfolio-blog-ops/blog.jar.before-abyss-equipment-f6bcf6d. New backend PID3355984 healthy; real public-character equipped-item request through asbc.app returned correct bound identity and six actual weapon rolls. Initial non-browser requests were rejected403 by existing policy; same-origin/browser-header verification passed without policy changes.
Pages deployment: https://056ff955.asbc-4c9.pages.dev (main). Custom domain https://asbc.app serves asbc-cJxILJ-9.js and asbc-Cb8NpByC.css; all initial JS/CSS asset hashes match the verified D-drive release artifact. API health200. abyss_schedules.py and equipment_advice.py PASS against operating origin (UI error scenarios use isolated fixture responses; real item API was verified separately). Mobile320/390 and desktop verified, no saved-plan mutation.
Last reviewed: Codex solo verification under explicit user release override; Claude review remains unavailable, not represented as passed.
Done: committed, pushed, backend and frontend deployed and operating-origin checks passed. No release blocker remains. Only unrelated JUHYEONL_FULLSTACK_CONTEXT.md, existing __pycache__, and tasks/collaboration/ remain untracked and excluded.
