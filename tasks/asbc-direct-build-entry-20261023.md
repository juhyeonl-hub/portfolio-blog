# Direct build entry
Owner: Codex. Base: 77f176934fee7a82067012c7714e60416c2f9c92.
[Task Goal]: Open the automatically calculated build directly from home, without numbered setup panels suggesting a required preview/apply process.
Scope: home entry copy, compact class/optional-character controls, build guide layout and translations. Keep level/point inputs visible and preserve the existing calculation, manual plan and explicit-save behavior.
Expected: one click opens #/build with skill/Daevanion targets already calculated; class and level changes update the shown result; no automatic overwrite of saved manual allocations. PC/mobile layouts remain usable.
Existing QuickBuild and translation changes are unrelated pending work: preserve their exact pre-task contents and stage only the separately generated release versions. Other pending files remain byte-identical.
Authorization: user requested these small UI fixes be deployed immediately. Prior no-Claude-review preference applies. Claude 불가로 Codex 임시 조율: existing usage limit until Oct 26, no retry or review pass claim.
Evidence: D:/CodexData/Projects/ASBC/artifacts/direct-build-entry-20261023.

## Verified before release
- PASS isolated typecheck:shadowcraft and build:asbc. Final entry asbc-BKeuWJa2.js / asbc-Bw2IaZ0n.css. Existing bundle-size/plugin timing advisories only.
- Home has Open build action; one click opens #/build, calculates existing algorithm automatically and displays skill targets and Daevanion without connect/apply steps.
- Removed numbered introduction/connection panels. Optional character controls now sit beside class choice. Level/point fields remain visible; long point assumptions remain accessible in a collapsed explanation. Help moved below results.
- PC 1440x900: first skill row fully visible (top 717, bottom 893). Class switch assassin to templar updates displayed skills.
- Level 20 templar: 61 skill / 0 stigma / 36 Daevanion; first two skill targets 8. Level 30: 111 / 8 / 76; targets 9 and 10. These are existing calculated defaults, not newly verified game totals.
- Mobile 360x800: no horizontal page overflow (345=345); fields editable, skill detail opens, Daevanion budget changed to 40 and display updates to 40/40; Zikel tab switches.
- Changed English menu and calculation-summary strings verified. Existing Korean source fallback for untranslated older copy remains unchanged.
- No recommend/apply/persistence algorithm changed, and no automatic save of calculated targets added.
- Existing 210 unrelated files byte-identical. Existing QuickBuild and translations added/removed lines are identical before/after when compared against their respective scoped base versions.

## Production verification
- Source committed/pushed: 6f2a1592e33de622cfa562fe5ed7e5750c49c243.
- Deployed the isolated, tested dist-asbc build with unchanged Pages functions: https://5f2382cc.asbc-4c9.pages.dev.
- https://asbc.app/ returns 200; all four referenced entry assets match local SHA-256 exactly. Evidence: production-verification.json.
- Deployed UI: home Open build button opens #/build immediately. Templar level 20 shows targets 8/8 and Daevanion board; mobile level 30 automatically updates to targets 9/10 and 76 Daevanion total without extra action. Existing calculation only, no new game-reward assertion.
- PC 1440x900 and mobile 360x800 inspected. Mobile document width 345 equals scroll width 345; no horizontal overflow.
- Screenshots: production-pc.png and production-mobile.png in the evidence folder.
- Final preservation: all 210 unrelated paths retain original hashes, all six changed source files retain verified hashes, and the two overlapping files retain exactly their pre-existing pending diff. No cross-review claimed.
