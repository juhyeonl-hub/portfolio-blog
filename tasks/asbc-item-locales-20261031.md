# Official client languages for item names
Owner: Codex; allocation and read-only reviews: Claude.
Scope: official per-language item names across equipment comparison/detail/list/common items/quest rewards; global database item/skill names and skill descriptions; selected-language stat labels. Raw API, user-authored/OCR names, saved plans, formulas and unrelated changes are unchanged.
Done when: eight official languages match installed client by stable ID; unsupported Finnish visibly falls back; PC/mobile names and search tested.
Base commit: ab1f8d15c4813f1d6c5fd129b1b87b72d6e70457

Verification (2026-10-31):
- 8 bundles, each 9,308 items and 280 player skills. ko/en/ja/fr/de/es/pt-BR/ru. Installed text build 26262663; existing numeric table build 25926599, explicitly separated.
- Official sample IDs: 110430021 = 빛나는 건룡왕의 활; 110430037 = 분노한 크로메데의 장궁.
- All eight source regenerations byte-identical after generator stat-key hardening.
- Typecheck and production build passed. client-locales, client-index, item-index, localization, equipment-advice, ranker-builds, character-comparison and journal-index suites passed. Includes malformed inputs, ID/name provenance, fallback, wrong-language rejection, concurrent cache deduplication, retry, inherited stat-key rejection and input nonmutation.
- IAB actual control interactions: 62 assertions passed. PC 1200/1440 and mobile viewport 390; eight languages on GreenOrc/Bless equipment, database local-name search, item details, skill descriptions and expanded comparison table. Korean/English/ID search in Japanese, reward item names, Finnish original-text fallback also checked. Mobile viewport emulation, not a physical handset.
- Existing German recommendation button extends page by ~3px on mobile; outside this item-name scope. New item names/database content wrap without overflow.
- Build/source/test records and screenshots: D:/CodexData/Projects/ASBC/artifacts/item-locales-20261031.

Last reviewed: allocation passed status0; first review timed out with no output, then one permitted retry passed status0/error=null/scope=[] at 2026-10-31T11:36:21.407Z. No blockers. Two optional stat-key guards added and tested. Final follow-up asbc-item-locales-final-review-20261031-1793446903482 also passed status0/error=null/scope=[]; no blockers.
Findings resolved: generator/runtime stat-key validation aligned; stats use own-property lookup; remaining English equipment table/common-item/reward surfaces wired. Existing comparison identity/change semantics preserved.
Limitations: Finnish has no official game dictionary, so English/original is explicit. Unknown future IDs retain raw names. New descriptions do not interpolate older numeric effects; unresolved placeholders remain marked. NPC/quest/dungeon/pet titles are outside this item/skill localization change and retain their existing source text. No automatic source import/deployment is claimed.
Uncommitted: only this task scope in isolated worktree; see artifacts scope.txt/preservation.json. Primary 302 dirty entries and all 447 pre-existing worktree entries preserved by status and SHA-256.
Next: ready for requested commit/push/deployment of this scope; not staged, committed, pushed or deployed in this task.
Blocker: None.

## Release authorization (2026-10-31)
User: “이런 작은 건 들은 바로바로 배포 해”. After verification, small fixes of this kind should be released without requesting deployment approval again. This authorizes commit, push to remote main and ASBC production deployment of this reviewed language-display scope only. Previous local-only status is superseded. No backend/auth/storage changes. Build from a clean Git archive; preserve all unrelated changes. Release evidence: D:/CodexData/Projects/ASBC/artifacts/item-locales-20261031/release-result.json.
