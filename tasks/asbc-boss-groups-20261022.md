# Boss category buttons
Owner: Codex, Claude allocation approved (execution status0, no writes).
Scope: picker categories 전체/천족/마족/어비스; unknown only when present. Display labels and CSS only, IDs/settings/API unchanged.
Done when: targeted tests, responsive browser verification, build, review, authorized deploy/commit/push.
Base commit: 54a48ef89e24869ad9d61b1b4013888e7d1a23de
Verification: typecheck/lint/event-timers/localization/build:asbc PASS; all_boss_pins.py and timer_pins.py PASS (320/390/1366,4locales, settings/keyboard/storage). Mobile screenshot inspected. 1890 artifact hashes match source.
Last verified: 2026-10-22 source confirms sole null-side boss2001 is LowerReshanta.
Last reviewed: Claude cross-review no blockers, execution status0, read-only scope verified.
Findings: preserve catalog null, map to Abyss for display/filter only.
Uncommitted: this task only; unrelated untracked preserved.
Next: complete; commit/push only task files.
Blocker: none
Production: https://ad0de439.asbc-4c9.pages.dev ; custom asbc.app final bundle asbc-CstRLU-J.js verified. Live mobile category buttons return24/24/1; screenshot evidence D:/CodexData/Projects/ASBC/evidence/boss-groups-20261022/production-abyss.png. Backend unchanged.
