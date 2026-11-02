# Main Daevanion comparison visibility
Owner: Codex; Claude 불가로 Codex 임시 조율 (allocation timeout60s, no response).
[Task Goal]: Show already-owned target nodes, additions, and owned outside-plan nodes clearly like ranker comparison.
Scope: page.tsx board presentation, dedicated CSS, locale strings. No plan calculation/persistence changes. Preserve prior mobile/point fixes.
Expected: valid actual snapshot => keep green check/add orange plus/remove red minus/neither dim; automatic root excluded. Unknown character boards => existing plan view with no false actual comparisons. Both plan/current views show same target-difference states. Selected status visible above board and mobile controls; counts exclude root. Removal is review, not automatically applied or universally bad.
Verification PASS: typecheck, localization(all74screens/eight locales), navigation, build:asbc, lint/postlint. Existing chunk-size/plugin-time build warnings retained. Browser1100x1100: GreenOrc vs recommended plan on first board keep37/add18/remove18/empty15, legend agrees, automatic root excluded; selection status updates and current-view toggle preserves differences. No-character Chanter shows no comparison. Mobile430x932: document width415/no overflow, badges73, selected removal label updates, long inspector remains hidden. Console errors[]. Screenshot artifacts/board-visibility-20261102/desktop.png. Incomplete-data gating uses existing characterPoints validity; no synthetic browser injection or physical handset test.
Base c438cdc plus prior changes; no commit/push/deploy.

Completed locally. No commit/push/deploy. Prior mobile and point recognition work preserved. Claude coordination timeout recorded; no peer-review pass claimed.
