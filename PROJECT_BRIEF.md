# Project Brief

## Project Name
Portfolio Blog (working title -- final name TBD)

## Final Goal
A personal portfolio blog with project showcase, online resume/CV, daily dev journal, guestbook, and project reviews -- deployed on AWS with a custom free subdomain, always-on server.

## Tech Stack & Environment
- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Flyway
- Database: PostgreSQL (same Lightsail instance initially)
- Cache: Redis (optional, add later if needed)
- Frontend: React 18 + Vite + TailwindCSS
- Frontend Deploy: Vercel (free subdomain: {username}.vercel.app)
- Backend Deploy: AWS Lightsail $5/month plan (1GB RAM, 40GB SSD)
- Auth (Admin): Dual authentication
  - Browser login: ID/Password + TOTP (Google Authenticator)
  - Local/AI access: API Key via Authorization header (env variable, restricted to localhost/allowed IPs)
- Auth (Visitors): None (anonymous guestbook and reviews)
- Image Storage: Lightsail local filesystem (/uploads/, static serve)
- Build: Maven (backend), npm (frontend)
- OS: Ubuntu (WSL for local dev, Ubuntu on Lightsail)

## Main Features

### 1. Home Page
- Intro / short bio
- Recent journal posts preview
- Links to portfolio, resume, journal sections

### 2. Portfolio (Project Showcase)
- Project cards with thumbnail, title, tech stack tags, short description
- Project detail page: full description, screenshots, GitHub link, demo link
- Visitor reviews per project (anonymous, no auth required)
- Admin: CRUD projects from admin dashboard

### 3. Resume / CV
- Online interactive resume page
- PDF download button
- Sections: summary, experience, education, skills, certifications
- Admin: edit resume content from admin dashboard

### 4. Journal (Dev Blog)
- Markdown-based blog posts with syntax highlighting
- Tag system for filtering (e.g., [Dev], [TIL], [Project], [Life])
- Two writing methods:
  a) CMS: write directly from admin dashboard (rich markdown editor)
  b) GitHub sync: push .md files to a specific repo/folder -> auto-publish (Phase 2)
- Pagination, search by title/tag

### 5. Guestbook
- Visitors leave messages (anonymous, nickname + message)
- Admin: delete inappropriate messages

### 6. Project Reviews
- Visitors write reviews on specific portfolio projects (anonymous, nickname)
- Star rating (1-5) + text comment
- Display on project detail page
- Admin: moderate reviews

### 7. Admin Dashboard (admin only, ID/Password login)
- Manage portfolio projects (CRUD)
- Write/edit journal posts (CMS)
- Edit resume sections
- Moderate guestbook entries and project reviews
- Simple analytics: page views, popular projects

## Directory Structure
```
portfolio-blog/
├── CLAUDE.md
├── PROJECT_BRIEF.md
├── backend/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/portfolio/blog/
│   │   │   │   ├── BlogApplication.java
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── model/
│   │   │   │   ├── dto/
│   │   │   │   └── exception/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-prod.yml
│   │   │       └── db/migration/
│   │   └── test/
│   └── Dockerfile
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   └── assets/
│   └── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
└── README.md
```

## Completion Criteria
1. Backend builds successfully: `mvn clean package` passes with no errors
2. Frontend builds successfully: `npm run build` produces dist/ with no errors
3. Local dev environment runs: docker-compose up starts backend + postgres + frontend
4. Home page loads at localhost:5173 showing intro and recent journal preview
5. Portfolio page displays at least 1 sample project card
6. Clicking a project card shows the detail page with description and tech tags
7. Resume page renders all sections and PDF download works
8. Journal page lists posts with tag filtering working
9. Admin can log in via ID/Password and access the admin dashboard
10. Admin can create a portfolio project from the dashboard and it appears on the public site
11. Admin can write a journal post from the dashboard and it appears on the journal page
12. Guestbook page allows any visitor to leave a message (nickname + message)
13. The message appears on the guestbook page with the visitor's nickname
14. AWS Lightsail deployment: backend API accessible at the public IP
15. Vercel deployment: frontend accessible at {username}.vercel.app
16. Frontend successfully communicates with the deployed backend API

## Notes
1. Design: Dark mode only, minimal developer aesthetic (think Linear/Notion dark mode)
2. No OAuth for visitors. Guestbook and reviews are anonymous (nickname-based). Simple spam prevention via rate limiting.
3. GitHub repo: portfolio-blog (new repo under Hive-juhyeonl)
4. The site owner (admin) is Juhyeon Lee, Hive Helsinki student. Background: Java/Spring Boot backend experience from Korean fintech, currently studying systems programming at Hive Helsinki, Finland. Resume positioning will shift to Agentic Engineering.
5. Budget: ~$5-10/month for AWS Lightsail. Frontend on Vercel free tier.
6. Journal GitHub sync feature can be Phase 2 -- CMS writing is Phase 1 priority.
7. No mobile app needed. Responsive web design is sufficient.
8. Language: Site content in English (targeting Finnish/international employers).
9. Previous project context: PEER had Spring Boot + PostgreSQL + React + AWS architecture. Same stack carries over but the application is completely new.
10. Dev environment: WSL (Ubuntu) on Windows.

## Task Progress

### Phase 0: Project Setup
- [x] Step 1: Initialize Spring Boot project (Java 21, Spring Boot 3, Maven)
- [x] Step 2: Initialize React project (Vite + React 18 + TailwindCSS)
- [x] Step 3: Set up local PostgreSQL database (Docker Compose deferred)
- [x] Step 4: Configure Flyway and create initial DB schema
- [x] Step 5: Verify local dev environment runs end-to-end

### Phase 1: Auth System
- [x] Step 6: Configure Spring Security + admin ID/PW + TOTP authentication
- [x] Step 7: Implement admin login API + JWT token issuance (browser path)
- [x] Step 8: Implement API Key authentication (local/AI path, IP restriction)
- [x] Step 9: Frontend admin login page (ID/PW + OTP input) + auth context + route guards

### Phase 2: Portfolio CRUD
- [x] Step 10: Create Project entity, repository, service, controller (backend)
- [x] Step 11: Admin dashboard: project create/edit/delete UI
- [x] Step 12: Public portfolio page: project cards and detail page

### Phase 3: Resume Page
- [x] Step 13: Create Resume entity/model and admin edit API
- [x] Step 14: Public resume page with all sections
- [x] Step 15: PDF download functionality (browser Print/PDF)

### Phase 4: Journal / Blog
- [x] Step 16: Create Post entity, CRUD API with tag system
- [x] Step 17: Admin CMS: markdown editor for writing posts
- [x] Step 18: Public journal page: list, tag filter, search, pagination
- [x] Step 19: Markdown rendering with syntax highlighting

### Phase 5: Guestbook + Reviews
- [x] Step 20: Guestbook entity and API (create/list/delete, anonymous)
- [x] Step 21: Guestbook UI (nickname + message form)
- [x] Step 22: Project Review entity and API (create/list/moderate, anonymous)
- [x] Step 23: Review display on project detail page

### Phase 6: Admin Dashboard
- [x] Step 24: Unified admin dashboard layout
- [x] Step 25: Analytics: page views, popular projects

### Phase 7: Deployment
- [x] Step 26: AWS EC2 setup (backend + PostgreSQL) — 13.50.178.179
- [x] Step 27: Vercel deployment (frontend)
- [x] Step 28: Domain configuration (juhyeonl.dev), CORS, HTTPS via Vercel

### Phase 8: GitHub Sync (Optional)
- [x] Step 29: GitHub webhook listener for journal .md files
- [x] Step 30: Auto-publish synced markdown posts

### Bootprint invite-page maintenance — 2026-09-23 (user approved)
- Scope: existing `frontend/public/territory-run/join/` page, Bootprint brand assets and Android link association only.
- Expected: EN/KO/FI/SV selection, validated invite code, copy-code/install/open-app actions; no automatic joining.
- Failure cases: missing/invalid code, unavailable clipboard, app not installed, old app without join route.
- [x] Implement and browser-check the invite page.
- [x] Verify frontend build and existing URL/custom-scheme compatibility locally
- [x] Deploy after Vercel authentication; verify production assets and links.
  - 2026-09-24: production `dpl_3z41kM7Qa8fmatkydS22rbZ5tPnG`, `https://juhyeonl.dev/territory-run/join`. EN/KO/FI/SV, mobile widths, invalid/missing codes and clipboard failure verified in Chromium.

### Shadowcraft integration — 2026-10-15 (user requested)
- Scope: separate Vite HTML at `/lab/shadowcraft/`, Spring public lookup/catalog and authenticated admin catalog updates. Anonymous local plans; preserve original keys and JSON transfer.
- Expected: eight classes, budget/gear/OCR, persistent plans, preserved runtime snapshots.
- Failure cases: blocked storage, invalid imports, external lookup errors, unauthorized updates, invalid upstream schema.
- [x] Implement and locally verify planner integration against handoff acceptance criteria; see `shadowcraft/INTEGRATION.md` for evidence and remaining production/user-data checks.
- [x] Deploy backend V12 and frontend to `https://juhyeonl.dev/lab/shadowcraft/`; verify database backup, unchanged existing content and production HTTPS browser acceptance checks (2026-10-15).

### a2bc completion — 2026-10-15 (user confirmed scope)
- No personal plans require migration.
- Official news automatically refreshes; catalogs are imported manually from reviewed files. No automatic Gaming.Tools collection.
- [x] Verify failure preservation, review baseline, production refresh and full regression suite.
- [x] Prepare and review requested product changes for Git; exclude personal context and credentials. Commit/push is verified against remote HEAD in the completion report.

### a2bc global official data and feature expansion — 2026-10-15 (user requested)
- This supersedes the previous completion scope: target Global/Steam only; exclude Korean/Taiwan data. Preserve existing plans, imports and blog functionality.
- Reimplement observable Gaming.Tools functionality in our code, including database browsing, builds, equipment tools, crafting and interactive maps. Do not treat third-party implementation or data as official NC data.
- Expected: each supported dataset has a verified Global official source, retrieval time and schema validation. A missing source or malformed response must not replace the working catalog or be labeled as a completed migration.
- Failure cases: official HTML error pages returning HTTP 200, missing global datasets, incomplete character responses, patch/version mismatch, broken saved-plan compatibility.
- [x] Inspect current integration and publicly visible reference features; user confirmed full-site scope including maps/crafting.
- [x] Verify Global official class/type endpoints: `en-us/api/gameinfo/classes` returns eight classes; `en-us/api/gameinfo/pcdata` returns character-type mappings (`region=eu&lang=en-US`).
- [ ] Resolve official catalog sources before replacing snapshots. The official character page bundle references `/en-us/api/gameconst/item`; a request for item `110330060`, enchant levels 0/1, `region=eu&lang=en-US` redirected to `https://www.plaync.com/error/404` (HTTP 200, HTML). A bundle reference alone is not evidence of a working data feed.
- [ ] Verify complete global skill levels/costs/specializations and board topology. Character-specific equipped skills/unlocked nodes are not a complete master catalog.
- [ ] Implement database search/filter/detail and equipment comparison using verified official records.
- [ ] Implement crafting material/cost calculations after verifying global recipes and quantities.
- [x] Prepare the independent crafting calculation engine with synthetic fixtures while official recipe ingestion remains blocked. Input is an explicitly selected recipe per output item, target quantity, inventory and integer currency-unit prices/fees. Aggregates shared intermediate demand before batch rounding, consumes stock once, reports unpriced purchases as unknown total cost, rejects cycles/invalid counts/overflow. No inferred game recipes or runtime UI connection in this step.
- Crafting implementation: `frontend/shadowcraft/lib/crafting.ts`, tests in `frontend/shadowcraft/tests/crafting.mjs`, included in `npm run test:shadowcraft`. Output includes executable craft order, surplus, purchased materials, inventory consumed, known purchase costs and fees. Caller explicitly selects one recipe per item; items without a selected recipe are purchased. Scope is deterministic outputs only; random success/critical outcomes, byproducts and automatic cheapest-recipe optimization remain unimplemented.
- Crafting validation: 120 synthetic execution-ledger scenarios plus shared-demand rounding, stock, missing/free prices, cycles, duplicate IDs/ingredients, invalid inputs, overflow and nonmutation checks passed. All seven `test:shadowcraft` suites, `typecheck:shadowcraft`, `npm run build` and `git diff --check` passed. Build reports >500 kB chunk and plugin-timing warnings. No deployment or production-data replacement in this step.
- [x] Add crafting tab with explicit empty official-catalog state and local user-file import. Imported files never become verified official data based on self-reported metadata. Validate global schema, named item references, quantities, fees, duplicate/recursive recipes and bounded file size before replacing state. Search, quantity/inventory/prices, intermediate-craft toggle and purchase/craft/surplus/cost results are connected to the calculation engine. Unknown prices remain unknown; invalid input hides stale results. Tab changes preserve session inputs; refresh/class change clears them with a visible notice. Existing plan storage is untouched. Import contract documented in `shadowcraft/INTEGRATION.md`; official data feed and production deployment remain pending.
- [x] Crafting UI validation: all eight `test:shadowcraft` suites, TypeScript check and Vite build passed. Chromium synthetic-fixture acceptance passed for empty state, search, 19-unit full crafting / 22-unit intermediate purchasing, missing prices, invalid quantities, malformed/non-global file preservation, tab retention, unchanged saved plans and zero POST requests. Mobile 390px page has no horizontal overflow; screenshot inspected. Existing chunk-size/plugin-timing warnings remain. Initial typecheck invocation used the repository root instead of `frontend`; corrected invocation passed.
- [ ] Implement interactive map search/layers/markers/progress after verifying global map assets and coordinates.
- [x] Implement the independent map interface using user-supplied normalized Global datasets while official coordinates remain blocked. Search, category filters, completion tracking, zoom/pan and explicit missing-background/official-data states are connected. Validate bounded coordinates, references and file size; partition browser progress by complete dataset hash; preserve corrupt progress and existing build storage. No inferred game coordinates or production data substitution.
- Map validation: all nine frontend regression suites, TypeScript check, Vite build and `git diff --check` passed. `python3 shadowcraft/tests/map.py` passed synthetic browser acceptance for imports, search/layers, keyboard/drag/zoom, completion/reload restoration, version isolation, corrupt and blocked storage, 390px layout, unchanged build storage and zero POST requests. Mobile screenshot inspected. Build retains >500 kB chunk warnings. Background map assets, verified official coordinates and production deployment remain pending; current UI is a coordinate viewer, not a completed official game map.
- [ ] Inventory remaining reference functions (build/macro tools, progression, server status and linked tools), define inputs/outputs and implement each with independent tests. Reference navigation links do not prove that linked external services belong to the reference site.
- [ ] Run full regression tests and browser acceptance checks, then deploy the expanded product. Investigation is not implementation completion.
- Evidence: official `https://aion2.plaync.com/en-us/characters/index` and its public `https://assets.playnccdn.com/static-aion2/characters/js/index.js` bundle; reference `https://aion2.gaming.tools/`, `/items`, `/builds`, `/macros`, `/map`. Observed on 2026-10-15. No third-party bundle, recipe database or map dataset was copied into the repository.
- [x] User extended data-source investigation to the installed official Global Steam client (2026-10-15).
- [x] Locate installed client via Steam library/app manifest: app `3393110`, build `25926599`, install directory `C:\Program Files (x86)\Steam\steamapps\common\AION2`. Steam build ID is not a verified game-data version.
- [x] Read-only archive inspection: 282 IoStore TOCs (version 5) recursively, including localization containers. Flags: 230 compressed/encrypted/signed/indexed, 15 encrypted/signed/indexed, 36 signed/indexed, one signed global container. Thus 245 have the encrypted flag. The top-level Paks directory contains 268 TOCs (242 encrypted), with 14 more in localization folders. Counts describe installed files, not verified usable datasets.
- [x] Inspect unencrypted directory indexes in the top-level directory (25) and non-Korean localization directories (9): each has one root directory, zero file entries and zero strings. `global.utoc` has no directory index. No readable skill/recipe/map catalog was recovered. Korean localization content was not parsed.
- Initial blocker (superseded by the partial extraction below): archive reader/decryption configuration was unavailable. Existing Gaming.Tools-derived snapshots are still not official-client exports. No game installation files were modified, and no game process was attached to.
- Format cross-check: CUE4Parse `FIoStoreTocHeader.cs` and `FIoStoreTocResource.cs` at `https://github.com/FabianFG/CUE4Parse/tree/master/CUE4Parse/UE4/IO/Objects`; encrypted flag is bit 1. Inspection read only headers and unencrypted directory metadata, not game payloads.
- Verification: existing `npm run test:shadowcraft` suite passed after this investigation; runtime application code is unchanged.
- [x] Expand source discovery to community wikis and public repositories (user requested, 2026-10-15). Previous blockers were limited to verified official endpoints/local metadata, not proof that no external datasets exist.
- Candidate: [Aion2Data](https://aion2data.com/about) states Global 2.0.6.0 hotfix 1, Steam build 25800038 (2026-10-09), using CUE4Parse plus community mappings. Its public pages expose class skills, crafting and six maps. A downloadable complete export/API and redistribution grant were not verified. Its stated build differs from local build 25926599.
- Candidate: [AION 2 Wiki](https://aion2wiki.date/) states Global-only coverage. [Its terms](https://aion2wiki.date/legal) expressly exclude automated bulk extraction/database mirroring. Use as a reference; not an approved ingestion source.
- Candidate: [DBAion2](https://dbaion2.online/en/) has skills, crafting and map sections; [AION2 Codex](https://aion2codex.com/crafting) attributes its recipe/location associations to DBAion2 and separately describes limited official EU item cross-checking. Region/version and export/reuse conditions still need verification.
- Concrete public files: [aion2-interactive-map](https://github.com/aion2-interactive-map/aion2-interactive-map) master tree is untruncated, 6477 files at inspection, including `public/data/boards/Assassin.yaml` (and seven other classes), `public/data/items/crafting.yaml` and `items.yaml`. README assigns GPL-3.0 to `/src` and CC BY-NC 4.0 to `/public/data`. Global/current-build provenance is not yet verified; licenses of assets outside that data path must not be inferred. No payload imported into a2bc.
- Concrete JSON snapshot: [Aion2-TM-DesktopApp](https://github.com/aiwh-cli/Aion2-TM-DesktopApp) has `web/public/data/manifest.json`, fetched and parsed successfully. It records upstream blacksole release v2.0.7, imported 2026-09-19, with hashes for skills, recipes, items and boards. This is an app release number, NOT game version 2.0.7. Its README says custom upstream license and mixed source references; current Global provenance/reuse remains unverified.
- Direct extraction lead: [CUE4Parse Aion2 objects](https://github.com/FabianFG/CUE4Parse/tree/master/CUE4Parse/GameTypes/Aion2/Objects) includes data-table, map, map-hierarchy and localization parsers. Library license is Apache-2.0; this does not license game assets. `FAion2MapDataFile` requires game mappings. Compatibility with installed build, required mappings and archive mounting remain untested. Replace the earlier assumption of an unavailable reader with this concrete candidate.
- Next verification order: test current-client reader compatibility and mappings; inspect public dataset region/version evidence; only then map validated records into a2bc. Do not equate public browsing, an English translation or a GitHub repository with current Global provenance or a reuse grant.
- [x] Build and test [uex](https://github.com/arkive-games/uex) in `/tmp/a2bc-uex`, commit `812e16238b41dd8ec31b0bd4b5ba23884f64e48c`, pinned CUE4Parse `ec6595e46448a817ac21ea9bde01caa48f80a420`. Existing Windows .NET SDK 10.0.301 compiled it; `dotnet test tests/Uex.Tests/Uex.Tests.csproj -c Release --nologo`: 49 passed, zero failed/skipped.
- [x] Run actual Global client diagnostic using `GAME_Aion2` and the installed Steam Paks path, with no archive key/mappings available: `dotnet src/Uex/bin/Release/net10.0/uex.dll --config global-probe.json doctor --profile a2bc-global` exited 1, `mounted 0 files`. No game-data record was extracted. This proves the current configuration is insufficient, not that the parser cannot support Global.
- Initial extraction blockers (superseded below): no local FModel settings or mappings were found in the inspected expected locations; FModel default endpoints have no AION2 entry; its public game-information lookup returned 403. The uex example is explicitly TW and is not a verified Global mapping.
- Tool qualification limitations: upstream restore reports NU1902/NU1903 for ImageSharp 3.1.12 / Microsoft.Bcl.Memory 9.0.0; upstream C# warnings remain. Optional native CMake build did not run (Windows CMake unavailable/UNC cwd), while managed build and tests passed. Do not deploy this diagnostic checkout as an automatic production updater. No game files or application runtime code changed.
- [x] Resolve archive mounting with publicly documented reader configuration and [community mapping](https://github.com/Dim0s/Unreal-Mappings-Archive/tree/main/AION%202), `AION2-5.3.2.0.usmap`, SHA-256 `12513ea504185d279c4fa1d585ad684476ff1ecac36b4a2fcb524afb1d48d45c`. Mounted 562 archives / 919355 virtual files from the installed Global client. This mapping's compatibility with every current table is NOT established. No archive credentials were copied into the repository or report.
- [x] Targeted extraction of 14 tables: decoded `SkillList` (77 rows), `SpecializedSkillSlot` (8), `CraftMastery` (100), `WorldMapMapList` (3), `WorldMapUIRegion` (227). These are partial metadata, not full skill effects, recipes, map images or marker coordinates. The eight active class rosters contain 35 unique IDs each; all 280 match existing a2bc catalogs. ID agreement does not validate levels, costs, effects or board topology.
- Current blocker: `Skill`, `SkillLv`, `SkillAcquireData`, `SpecializedSkill`, `CraftRecipe`, `CraftRecipeRate`, `Map`, `MapEntrance`, `WorldMapFieldNamed` fail decoding (field/type mismatches, missing struct mappings or bounds errors). Raw `.dat` fallback files exist, but must not count as decoded tables. Obtain compatible current schemas before any production migration; do not guess field layout. `uex export` can exit zero despite partial failures; `doctor` only checks package assets and is insufficient for these `.dat` tables.
- [x] Preserve 5 JSON exports and 9 raw fallbacks outside the application repository at `/home/juhyeonl/workspace/a2bc-client-research/steam-25926599/tables`, with SHA-256 provenance in `manifest.json` and validation in `audit.json`. The Steam build is verified; game-data version and live availability of internal records remain unverified. Research files are not production/public assets.
- [x] Add read-only `shadowcraft/operations/audit-client-export.py`: checks required decoded tables, active class rosters, malformed/duplicate IDs and catalog differences. `python3 shadowcraft/operations/audit-client-export.py /home/juhyeonl/workspace/a2bc-client-research/steam-25926599/tables` returns **2 (incomplete)** for this extraction, as expected; 0 only means structural completeness, never verified mapping semantics or production approval.
- [x] Audit regression tests: `python3 -m unittest discover -s shadowcraft/operations -p 'test_audit_client_export.py' -v` — 9 passed, synthetic fixtures only. Covers raw fallback, malformed JSON, missing classes/tables, invalid/duplicate/empty IDs, catalog mismatch and production-approval safeguards.
- [x] After adding the audit tool, rerun `frontend/npm run test:shadowcraft`: all six suites passed (persistence, gear, OCR, budgets, eight classes and armory). `git diff --check` passed. Application runtime/catalog files were not changed or redeployed in this step.
- [x] Next parser investigation: upstream [AION2 layout support commit](https://github.com/FabianFG/CUE4Parse/commit/52d7de4abec1368459d566e4a6ec4060e9626329) was applied as a patch to the previously pinned temporary CUE4Parse checkout. This adds TextProperty support and failure offsets, but does **not** fix the nine table failures. All five successful table JSON files are byte-identical to the previous export. Existing uex tests: 49 passed. The inspected public mapping directory still lists only `AION2-5.3.2.0.usmap`; no newer compatible mapping was established.
- [x] Read additional Global client formats: `MapDataHierarchy` contains 740 world entries and two sample `MapEvent` files are valid JSON (`Seal_Verteron_001`, `Seal_Altgard_001`). Hierarchy references and event objectives are not map marker coordinates or proof of live availability.
- Important correction from strict validation: six `WorldMap` exports initially reported success but had unread trailing bytes. `World_L_A` read only 310/4843 bytes; `World_D_A` read 310/4567; starter maps each left 8 bytes; Abyss A/C left 418/446 bytes. Their parsed `WorldBoundBox.IsValid` fields are false. Treat all six as rejected/incomplete, not usable map settings. Two main `MapData` coordinate files fail at `WaypointsDataMap` (World L offset 5028355; World D offset 6142631).
- [x] Add research-only `shadowcraft/operations/aion2-strict-consumption.patch`: require archive position to equal length before returning table, map or hierarchy objects. The five original tables and hierarchy pass; the six incomplete world maps fail closed. Byte consumption alone still does not prove mapping semantics. Never skip trailing bytes or bypass this gate to make an import pass.
- [x] Add `shadowcraft/operations/uex-tests/Aion2ConsumptionTests.cs`, with five synthetic test cases covering full/empty reads, partial reads and overreads. Combined uex suite: 54 passed, zero failed/skipped. Prior upstream dependency/C# warnings remain; this is a research tool, not a qualified automatic updater.
- [x] Preserve comparison exports and logs under `/home/juhyeonl/workspace/a2bc-client-research/steam-25926599/parser-verification`, with per-file hashes and explicit rejection status in `manifest.json`. No archive credentials or game payloads added to the application repository. Runtime features/data and deployment remain unchanged.

#### Reproduce the strict reader check (research checkout only)
- Start from uex `812e16238b41dd8ec31b0bd4b5ba23884f64e48c` with its pinned CUE4Parse submodule. Apply the upstream patch for commit `52d7de4abec1368459d566e4a6ec4060e9626329`, then `aion2-strict-consumption.patch` inside that submodule. Use `git apply --check` before each patch. Do not apply twice to the already modified `/tmp/a2bc-uex` checkout.
- Copy `uex-tests/Aion2ConsumptionTests.cs` into that checkout's `tests/Uex.Tests/`, then run `dotnet test tests/Uex.Tests/Uex.Tests.csproj -c Release --nologo` using the existing Windows SDK.
- Configure the locally held Global profile separately; do not commit or print credentials. Export each experiment into a **fresh directory**: a failed export can leave an older JSON beside a new raw fallback if the output directory is reused.
- Inspect per-file failure logs and raw fallbacks; process exit zero is insufficient. Run `audit-client-export.py` against the fresh Table directory. It checks structure/roster IDs only and cannot independently establish full byte consumption from JSON. Keep strict-reader logs and provenance together with its report.

#### Current-client extraction and read-only database (2026-10-15)
- Supersedes the earlier nine-table/partial-world-map decoder blocker: a separate strict decoder from `SemaAlter/Aion2_Client_Decoding` at `46fb22f36b8556c61f9a8c60ecef688222009552`, used locally with the installed Global Steam build 25926599, decoded 35 targeted table/map documents with complete byte consumption and table leaf-column counts. Its schema includes inferred/unknown fields. Structural success does not validate every field's semantics. Decoder code/schema is not copied into the application; no license grant was found. Its database-generation scripts and placeholder NPC combat values are not used.
- Preserve decoded research records, English localization and SHA-256 manifest outside the app repository in `/home/juhyeonl/workspace/a2bc-client-research/steam-25926599/october-decoded`. No archive credentials are stored there or in the app.
- [x] Independent `build-client-index.py` normalizes confirmed identity/classification/reference fields from Item, CraftRecipe, Skill and SkillList. Result: 9308 English-named items, 280 playable skill names and 1098 recipe material lists. All product/material references resolve; original input hashes and explicit Steam build ID are retained. Success probability and per-attempt fees remain null; live availability is explicitly unverified.
- [x] Add Global database tab with lazy loading, runtime validation, item/skill/recipe search and filters, pagination, details, and direct material requirements per attempt. It does not pretend uncertain success rates are guaranteed output, and does not overwrite existing planner data or storage. Source-of-truth scope is shown in the UI.
- [x] Compare 3840 existing learning rows and 896 specialization rows with official client SkillAcquireData and SpecializedSkillParts: zero differences in checked auto-learn, character-level, SP/stigma cost, parent skill and parent-level fields. Reproducible read-only `compare-client-planner.py`; this does not validate descriptions, scaling, board effects or the whole catalog's provenance.
- [x] Ten frontend regression suites, 19 Python extraction/normalization tests, TypeScript and production build passed. Database Chromium acceptance passed (actual bundled dataset, search, attempt quantities, invalid input, tab retention, unchanged saved plans, mobile overflow, malformed response and retry). Mobile screenshot inspected. Existing >500 kB bundle/plugin-timing warnings remain.
- Validation invocation corrections: test creation initially used repository-relative paths from frontend cwd; corrected without runtime impact. Browser execution inside the restricted process environment stalled; running the same test with the approved host-browser permission passed.
- [ ] Map projection/background images, skill effect/scaling semantics, deterministic-vs-probabilistic crafting rules, full official planner source migration, remaining site-function inventory and production deployment are still incomplete. This step is not whole-product completion.

- Map follow-up: located official `UI/Map/WorldMap/World_L_A` assets and successfully decoded the 2048×2048 tile `World_L_A_04_04` to PNG. Saved the tile and layout inspection outside the repo in `october-decoded/map-probe`. The `.umap` preview does not provide verified tile transforms (plane properties contain a suspicious OverlayMaterial reference to an AionPreviewLocation actor). Do not infer a projection from filenames or use these markers in production until asset mapping/coordinate alignment is checked. Image extraction is now possible; correct map placement remains blocked.
- Additional browser regression: existing crafting and map suites passed after database-tab integration. No POST uploads or saved-plan mutations were observed.
- Reference scope reconfirmed at https://aion2.gaming.tools/ on 2026-10-15: database navigation additionally advertises NPCs, quests, dungeons and pets; server status, tier lists and builds are separate features. Timers and market links point to external services. These remain inventory/implementation gaps, not features completed by the new index.
- [x] Publish the verified incremental tools: commit `d30cfd6` pushed to main, Vercel production Ready (`portfolio-blog-gf4gwxo4r-xxjuon-4682s-projects.vercel.app`). Production database browser acceptance and existing eight-class integration/JSON roundtrip/OCR-asset/mobile tests passed without page errors or plan-upload requests. Local eight-class integration also passed. This supersedes the incremental deployment-pending notes above, not the unchecked whole-product criteria.
- Final patch-format check initially flagged blank context lines in the research `.patch` file as trailing whitespace. Normalized those empty lines and verified `git apply --reverse --check` against the already-patched research checkout; staged `git diff --check` then passed.
- Production read-only checks: blog root, Lab, planner and client index returned HTTP 200. Deployed index SHA-256 exactly matches the committed 1,253,287-byte export. A Python urllib API probe returned 403; the unchanged request via curl returned 200, the local backend returned 200, and an actual production browser fetch (without mocking) returned 200 with assassin/35 skills/news refresh enabled. The Python-specific 403 cause is not established; do not report an application outage from that probe alone.

#### Official skill learning details (2026-10-15)
- [x] Extend the read-only Global index with all 3840 learning rows for 280 playable skills, directly normalized from `SkillAcquireData` with its input SHA-256. Show per-level character requirement, auto-learning, SP/stigma costs and ascension requirement in skill details. Costs are per learned level, not cumulative.
- Found 104 learning rows requiring `AscensionGrade_3`. Earlier zero-difference checks did not cover this field. `compare-client-planner.py` now explicitly reports `unmodeledAscensionRows: 104`; the planner still does not enforce ascension and the database UI states this limitation. Do not describe this as full planner migration.
- Validate matching classes, unique contiguous levels, integer costs and boolean flags. Reject newly encountered prerequisite-skill/item conditions instead of dropping them. Ascension codes remain original codes; no unverified gameplay interpretation or translated grade number is inferred. Older v1 index payloads without learning rows remain readable.
- Validation: 23 Python tests, all ten frontend suites, typecheck, production build and expanded Chromium database acceptance passed. Browser asserts Quick Slice level 5 requires character level 10 / SP 2, displays an ascension-gated skill, and retains existing recipe/search/storage/mobile/retry checks. Full real-data comparison still checks 3840 learning and 896 specialization rows; zero differences in the previously covered fields. Existing chunk-size/plugin-timing warnings remain.

#### Planner ascension gates (2026-10-15)
- [x] Enforce reviewed `AscensionGrade_3` acquisition prerequisites in manual increases and recommendations. A compact generated rule file carries source metadata and the reviewed index SHA-256; 104 skills (13 per class) require the condition at first acquisition, so every later learned level is also gated.
- Add optional strictly boolean `ascensionGrade3Confirmed` to per-class plans. Missing legacy values mean unconfirmed. Users confirm the condition in-game; no automatic armory inference or unverified numeric ascension-rank mapping. Export/import and persistence retain the field using the existing plan format.
- Preserve existing allocations on load/toggle and show unresolved-investment warnings. Decrement removes one level per click, rather than clamping a legacy allocation to zero. Applying a newly requested recommendation can remove gated investments; the existing preview/apply/undo flow remains in place. Equipment bonuses do not bypass the acquisition gate for an unlearned, unconfirmed skill.
- The comparison report now calls its count `ascensionConditionRows`; prior `unmodeledAscensionRows` notes describe the earlier implementation. This is a targeted verified-field overlay, not whole-catalog source replacement.
- Validation: all eleven frontend suites, 24 Python tests, TypeScript, Vite build and diff check passed. New browser acceptance passed for legacy level 10 preservation, decrement to 9, explicit confirmation/increment, reload persistence, uncheck preservation, explicit recommendation removing gated investment, and mobile layout. Existing eight-class integration/JSON roundtrip/OCR asset/mobile acceptance also passed with no page errors or plan uploads. Existing bundle-size/plugin-timing warnings remain.

#### Official Verteron terrain viewer (2026-10-15)
- [x] Extract all 64 official Global Steam World_L_A terrain tiles (2048×2048 each). Export reports 64 packages/64 textures and zero reported failures. English `String_STR_Map_World_L_A_body` resolves to Verteron. Raw exports and inspection evidence are preserved outside the repository under `a2bc-client-research/steam-25926599/october-decoded/map-probe/verteron-tiles`.
- Adjacent tile tests independently support increasing the first tile index toward the right and the second downward. All 112 neighboring RGB edge differences: median 1.467, maximum 7.935 / 255. A packaging gate rejects values >10 for this reviewed build; this is a review threshold, not a universal proof of map correctness. Camera rotation is pitch -90/yaw 270/roll 0. Eighteen observed preview-label positions also match the separate WorldMap metadata exactly.
- World-to-image projection remains unverified: `.umap` tile component fields still have suspicious material references and no verified transforms. Do not overlay raw NPC/collectible coordinates or claim full official map completion from image continuity. The manifest explicitly records `worldProjectionVerified: false` and `markerSupport: false`.
- [x] Package terrain as 64 WebP display tiles (1024×1024, 3,780,424 bytes total), recording source/display hashes and seam metrics. The operator script uses existing Pillow, adds no application dependency, validates complete inputs before publishing, and refuses to overwrite an existing output directory. It is pinned to reviewed Steam build 25926599.
- [x] Add an explicitly opened official terrain section in the map tab, with zoom, drag, keyboard pan, viewport tile selection, failure notice and retry. Images are not requested before opening it. User-provided maps/progress remain separate and unchanged; no inference of coordinate alignment. Import only display metadata into JS, not the complete audit/hash payload.
- Validation: twelve frontend suites, 29 Python tests, TypeScript, production build and diff check passed. Terrain browser acceptance verified lazy loading, all 64 successful image responses, a mocked 404/retry, zoom/drag/keyboard, mobile and untouched storage/zero POSTs. Existing user-map browser acceptance passed. Terrain screenshot visually inspected. The existing >500 kB bundle warning remains. One final file-edit command initially used repository-relative paths from frontend cwd; corrected before the final build.
- Published terrain implementation as `acad59c`; Vercel production Ready (`portfolio-blog-8os2afeef-xxjuon-4682s-projects.vercel.app`). Production browser acceptance passed after correcting its wait condition: retries may cancel pending first-pass image requests, so verify 64 unique HTTP-200 tiles rather than assuming 128 completed resource-timing entries. The initial production timeout was this test assumption, not evidence that terrain files were missing.
- Removed a Vite development warning about importing JSON from public: display metadata now lives in `lib/data/terrain-catalog.json`, generated alongside the public audit manifest when the optional metadata path is supplied. A test checks equality with the public manifest. Final compiled application asset hash is unchanged by this source relocation; typecheck/build and the five packaging tests passed. A file-edit command used the wrong cwd and was corrected with an absolute target before verification.

#### Verteron coordinate consistency audit (2026-10-15)
- [x] Add independent read-only `audit-map-coordinates.py` and a reproducible `map-coordinate-audit.json`, recording SHA-256 of the three decoded input documents from the reviewed Global Steam build 25926599. Join WorldMap label names (case-insensitive) through WorldMapUIRegion subzone IDs to MapData polygons; retain multiple volumes per subzone.
- 72 enabled Verteron region references: 69 joined; 3 unresolved. holyowlShelter lacks both label and subzone; DranaCultivationArea and DranaProcessingArea lack labels. These are reported explicitly rather than silently discarded.
- Compare 16 fixed hypotheses: two scales × eight axis/sign orientations, with no fitted translation. Identity axes at sector-size-derived 99.609375 contain 65/69 labels in their corresponding polygons; identity axes at 100 contain 64/69. Other orientations contain at most 5/69. Distances are raw world-coordinate units, not asserted meters.
- This supports axis correspondence but does not distinguish exact scale or establish texture origin/placement. Labels may be offset within/outside a region. Polygon containment is not a world-to-texture control point. Keep `worldProjectionVerified` and `markerSupport` false; no production markers or user-data changes.
- [ ] Next evidence needed: independently verified world-to-texture control points or correctly decoded tile component transforms. Do not choose a projection merely because it has the highest containment count.
- Validation: 35 Python tests (including six coordinate-audit cases), all twelve frontend suites, TypeScript and production build passed. Re-running the audit against the original inputs produces a byte-identical checked-in report. Diff check passed. Existing bundle-size/plugin-timing warnings remain. No runtime/UI changes in this step; browser acceptance was not repeated.

#### Verteron package reader failure isolated (2026-10-16)
- [x] Instrument the temporary research CUE4Parse package reader. The previous `.umap` JSON was a partial result: non-strict decoding recorded 121 StaticMeshComponent and 64 MaterialInstanceDynamic exception events, plus AionWorldSettings reading only 26 of 90 bytes. The material/transform anomalies are not trustworthy evidence of the intended layout. Exact schema/reader incompatibility is not yet identified.
- [x] Preserve opt-in research patches: `aion2-package-audit.patch` logs object reads when A2BC_PACKAGE_AUDIT=1, and A2BC_STRICT_PACKAGE_AUDIT=1 rejects exceptions and incomplete reads in Release builds. `uex-package-audit-exit.patch` makes strict batch exports return nonzero when the summary contains errors. These patches are for the external research checkout, not production application dependencies.
- [x] Real-file negative checks: strict layout preview exits 1 with zero output bytes; strict batch export also exits 1. First strict failure is AionWorldSettings with 64 bytes remaining. This intentionally failed validation confirms rejection, not successful layout decoding.
- [x] Strictly re-export all 64 terrain textures: 64 fully consumed Texture2D objects, 64 packages/64 textures, zero reported errors, exit 0. Every regenerated PNG SHA-256 matches the source hash in the published terrain manifest. No replacement production assets are needed.
- Preserve hashed evidence outside the application in `a2bc-client-research/steam-25926599/october-decoded/map-probe/package-audit`; repository `map-package-audit.json` contains the compact result. No profile files or archive credentials are copied.
- [ ] Blocker: repair/replace the matching package schema or reader, then independently verify terrain projection. Current mapping SHA-256 matches the October decoder dependency; merely reusing that copy cannot resolve the issue. Existing region-coordinate audit remains a separate DAT comparison, not projection proof.
- Validation: research uex 54 tests, Python 35 tests, all twelve frontend suites, TypeScript and production build passed; both research patches pass reverse-apply checks. Real strict positive/negative checks are recorded above. Existing application bundle-size/plugin-timing warnings and research dependency NU1902/NU1903/compiler warnings remain. No runtime change, so browser acceptance was not repeated.
- Final patch formatting check flagged an empty context line at EOF in the uex patch. Removed that context line and adjusted hunk counts; reverse-apply and staged whitespace checks were rerun before push.

#### Static-mesh inheritance boundary probe (2026-10-16)
- [x] Trace unversioned property indices in the quarantined research reader. Verteron tile components request indices 34, 136, 160 and 162; the existing mapping interprets these as OverlayMaterial, OnComponentHit, RelativeRotation and ComponentVelocity. MaterialInstanceDynamic also requests index 24, for which the mapping has no entry. This is evidence of a mapping/asset mismatch, not a justified field-name replacement.
- [x] Test one explicit hypothesis: increase StaticMeshComponent's own property count from 33 to 34, moving inherited-property lookup by one while leaving its own named entries unchanged. All 121 static mesh components then fully consume their bytes. Tile values resolve to material arrays, body instances, locations and scales. The missing field's identity and exact position remain unknown; this is NOT an approved new mapping.
- [x] Independently validate all 64 tile/root/texture references and unique 8×8 sector coverage. Centers follow -3584 + 1024×index on both axes (last center +3584); scales are (10.24, 10.24, 1). Maximum center residual is about 0.0001. Initial exact-equality checks rejected this floating-point roundoff; the documented validator tolerance is 0.001 (approximately four float32 ULPs at the largest center). The check does not assert actual plane bounds or game-world projection.
- [x] Add `audit-tile-layout.py`, five regression cases and `tile-layout-research.json`, explicitly marked research-only with wholePackageVerified/worldProjectionVerified false. MaterialInstanceDynamic still has 64 exception events; AionWorldSettings still has 64 unread bytes.
- Archive the temporary property-trace and count-gap patches plus outputs under `a2bc-client-research/steam-25926599/october-decoded/map-probe/staticmesh-gap`. Remove both temporary changes from active research source and rebuild; retain the previously reviewed strict rejection guard. No guessed mapping is installed into the application or official client.
- [ ] Remaining: identify the matching missing schema fields and resolve material/world-settings reads, or obtain independent texture/world control points. Grid recovery narrows the blocker but does not justify publishing world markers.
- Validation: 40 Python tests, all twelve frontend suites, TypeScript, application build and restored research-tool 54 tests passed. Re-running the geometry audit reproduces every generated field in the saved report. Original active ProviderManager/UObject sources are restored exactly; the reviewed strict guards remain. Existing build-size/plugin-timing and research dependency/compiler warnings remain. No runtime UI change; browser acceptance was not repeated.

#### Official crafting attempt planner (2026-10-16)
- [x] Connect the reviewed 1,098 official Global recipes to the crafting tab with lazy loading, schema validation, retry, search and selection. No longer show official recipes as entirely unavailable in the crafting calculator.
- [x] Calculate direct materials for 1–10,000 attempts, aggregate repeated item/enchant requirements, subtract stock once per requirement, and calculate purchase costs from user-entered integer prices. Keep differing enchant requirements separate. Zero prices are valid; missing prices remain unknown when purchases are needed. Reject invalid/unsafe arithmetic and hide stale results.
- [x] Explicitly leave successful output count and fee-inclusive total unknown. Combo/continuation outputs and probabilistic intermediate crafting are not inferred. This completes official attempt/material planning only, not verified success-rate or total-cost modeling.
- [x] Preserve the existing user-file deterministic planner, all saved builds and local-storage contents. Both calculators retain session inputs across tabs; the official calculator resets on refresh/class change, as disclosed. No uploads or new backend endpoints.
- Validation: all 13 frontend suites (including every shipped official recipe at 10,000 attempts), TypeScript, production build and 40 Python tests passed. Chromium official-attempt acceptance and existing user-file crafting regression passed, including lazy loading, malformed response/retry, real ingredients, stock/prices, invalid inputs, unknown totals, mobile overflow, unchanged storage and zero POSTs. Mobile screenshot inspected. Existing bundle-size warning remains.

#### Current completion boundary (2026-10-16)
- Implemented and tested: original blog integration/build preservation; Global character lookup; existing skill/gear/OCR/build tools; official news refresh; reviewed item/skill/recipe identity database and learning details; ascension-condition enforcement; official crafting direct-material attempt planning; user-file deterministic crafting and map progress; official Verteron terrain viewer.
- Still not complete: whole planner source replacement (skill scaling/effects and board semantics), official probabilistic crafting/fees, verified world-coordinate map markers, richer verified equipment comparison, and remaining NPC/quest/dungeon/pet/server-status/tier/build-site functionality from the full-site request. Do not reinterpret these as completed merely because independent tools or an index exist.
- Data blockers: the available package mapping is incompatible with some official assets; the count-gap hypothesis is quarantined, not an approved mapping. Available recipe probability/fee and full combat/board fields still lack verified meanings. Completion requires those facts plus implementation and acceptance of the outstanding site functions; permissions alone cannot establish source correctness.
- Additional regression: local eight-class browser integration passed catalog-failure preservation, class-specific reloads, recommendation apply, character search/recent selection, JSON roundtrip, OCR asset MIME paths and 390px layout, with zero page errors or plan network calls.

#### Compound Daevanion effect display (2026-10-16)
- Found a user-visible omission: 192 PvP nodes across eight classes contain two official stat effects, but the legacy node inspector renders only the first. Preserve the original catalogs and saved selections; supplement display from a narrowly validated official overlay.
- [x] Independently compare all 4,296 existing nodes' row/column, board reference, auto-learning, required level, point cost and reset cost with DaevanionNode. All checked fields agree and all conditions are None/empty. All 704 skill-level effects agree on skill ID and increment. These checks do not establish stat scaling, graph edge rules or whole-catalog provenance.
- [x] Generate 192 additional effects for reviewed integer-valued PvPCriticalResist/PvPEvasion/PvPDamageDefense slots. Require matching primary effect key/value/integer format and reject new slots, unknown secondary keys, mismatched field types/values or coverage changes. Retain existing Korean labels; record official node and catalog SHA-256 hashes.
- [x] Show both effects in the node inspector only when catalog version, node position and primary effect match the reviewed rule. Fall back to original display on changed/unreviewed catalog values. This is a display correction; it does not alter node selection, point budgets, persistence or heuristic recommendation weights.
- Browser acceptance initially assumed every new class already had a stored plan, producing a test null dereference. Updated the assertion to preserve either an existing node list or the unsaved null state. All eight classes and three compound-effect groups per class then passed, with unchanged node selection and no mobile overflow.
- Official crafting deployment `5daa3bb` is Ready at `portfolio-blog-rndvjpp62-xxjuon-4682s-projects.vercel.app`; production official-attempt acceptance and eight-class integration passed with no page errors or plan uploads.
- Final validation: 44 Python tests, all 14 frontend suites, TypeScript and production build passed. Eight-class compound-effect browser acceptance passed after the version guard; mobile inspector screenshot inspected. Regeneration exactly matches the committed overlay. Existing bundle-size warning remains.
- Published `29b4a5e`: Vercel production Ready (`portfolio-blog-e961h0g4u-xxjuon-4682s-projects.vercel.app`). Production eight-class compound-effect and official crafting browser acceptance both passed. This verifies these incremental changes only; the full-site completion boundary above remains open.

#### Official NPC identity browser (2026-10-16)
- Added an independently normalized Global Steam build 25926599 NPC identity index: 13,495 unique IDs, five source classifications and 895 explicitly missing English names. Record source hashes; expose no inferred combat statistics, coordinates or live availability.
- Separate explicit-load NPC panel under Global Data supports English name/ID search, type filters, 30-row pages, selection details, malformed-response rejection and retry. Existing catalogs and localStorage are untouched.
- Unit validation: all 15 frontend suites and 47 Python tests passed; TypeScript and production build passed with existing chunk-size warning. Existing client database browser regression passed. NPC browser initially used the wrong tab label; corrected to the actual Global Data label.
- This completes identity browsing only. NPC locations/quests and the previously documented full-site completion boundary remain open.
- NPC browser acceptance passed lazy loading, malformed response/retry, pagination, Citizen filter (3,755), ID search including unnamed entries, empty search, 390px layout and byte-identical localStorage. Explicit accessible names corrected the select label ambiguity.
- Published code `e96ad91`: Vercel production Ready (`portfolio-blog-n54ioc33a-xxjuon-4682s-projects.vercel.app`); the same NPC browser acceptance passed on https://juhyeonl.dev/lab/shadowcraft/. Local API proxy was unavailable during local browsing; bundled catalog fallback worked, and this change does not modify the backend.

#### Official quest, dungeon and pet browser (2026-10-16)
- [x] Extract/decode nine additional official Global Steam tables into separate research storage, preserving hashes. Quest 1,429; QuestStep 2,553; QuestReward 1,321; QuestString 1,490; Dungeon 733; DungeonGroup 67; VehicleList 209; VehicleCreatureLevel 50; VehicleCreatureOption 2,062. Successful byte decoding alone does not establish all field meanings.
- [x] Independently normalize identity/text fields and verified references into a lazy journal index. All quest strings, next-quest references, quest-step owners, 400 start NPCs, 424 finish NPCs and 733 dungeon map references resolve. All quest/pet names are localized; 25 dungeon titles remain explicitly unknown.
- [x] Confirm VehicleList corresponds to pets through official English UI strings (UI_VEHICLE_TITLE and UI_VEHICLE_TAB_VEHICLE = Pets). Publish identity/type only, not probability or stat interpretations.
- [x] Add search, classification, 30-row pages, details, next-quest navigation, NPC names/IDs, dungeon map names/IDs and pet identities. Preserve all existing plans and catalog files. Reject malformed source/records and allow retry.
- Validation: 16 frontend suites, 51 Python tests, TypeScript and build passed. Quest/dungeon/pet browser acceptance and eight-class integration passed (storage/class isolation, JSON roundtrip, budget apply, OCR assets and mobile). A duplicate pet-selection line accidentally inserted into the loading callback failed typecheck; removed and typecheck/build passed. Existing chunk-size warning remains.
- Official server-directory probe returned 46 EU rows with raceId/serverId/serverName/serverShortName only; it is not evidence of online state or congestion. No fake live-status display was added. Reference site's tier list depends on live leaderboard samples; no equivalent official acquisition pipeline is implemented.
- Full-site completion remains open: verified world projection, full skill/effect/catalog migration, crafting probability/fees, full equipment comparison and live status/ranking/build-site features. Identity browsing does not satisfy those requirements. See A2BC_STATUS_REPORT.md for completion boundaries and prerequisites.
- Published `c7633ea`: Vercel production Ready (`portfolio-blog-h809o4tci-xxjuon-4682s-projects.vercel.app`). Production journal, existing client-database and NPC browser acceptance all passed. Regenerated journal index is byte-identical. Full completion remains unclaimed; report records verified increments and unresolved requirements.

#### Mapping index coverage diagnosis (2026-10-16)
- [x] Add an opt-in read-only `mapping-audit` research CLI patch. It reads only a supplied usmap and requested type names; no profile, archive mount, key or game-process access. Report unchanged inheritance chains and property indexes.
- Current mapping: MaterialInstanceDynamic has 21 total slots (0–20), but the recorded Verteron trace requests index 24 on all 64 materials. StaticMeshComponent has 202 slots and its requested index 136 maps to `OnComponentHit` with unsupported `Unknown` type (121 events). AionWorldSettings has 153 slots; its three observed indexes exist, although the prior strict reader still leaves 64 bytes unread. This narrows compatibility failure, without proving which replacement fields or parser changes are correct.
- [x] Add `audit-mapping-coverage.py`: reject mixed trace/mapping snapshots, duplicate/invalid schema records, inconsistent inheritance totals and absent/malformed trace coverage. Emit a diagnostic report and exit 1 for missing/unknown indexes. Even successful index coverage never certifies semantics, package completeness or projection.
- [x] Real diagnostic intentionally exits 1 with 64 missing-index and 121 unknown-type events. Six new regression tests plus existing Python tests pass (57 total). Research command builds successfully and its patch passes reverse-apply validation. No application code, saved plans, client files or production map markers changed.
- Research uex test suite: 54 passed, zero failed/skipped. Existing research dependency vulnerability warnings remain; the application dependency tree was not changed.

#### Build library, recipe navigation and official Steam activity (2026-10-16)
- [x] Add independent per-class named build snapshots (20 slots), preview, explicit apply, persistent recovery, export and confirmed deletion. Preserve existing plan keys and JSON format. Reject malformed storage, quota failures and stale-tab writes; serialize writes with Web Locks.
- [x] Link item outputs/materials to all matching reviewed official recipes and recipe materials back to item details. Preserve calculator and storage behavior.
- [x] Add official Steam app 3393110 total player count via a read-only public backend endpoint, one-minute request cache, response validation and last-success timestamp/stale state. UI fetches only while its tab is active and polls once per minute while visible. This does not establish regional server status or congestion.
- Validation: 17 frontend suites, TypeScript, production build, 19 backend tests and 57 Python operations tests passed. New browser tests cover library recovery/export/quota/concurrent tabs, recipe links, and activity success/failure/invalid response/stale/zero/recovery/mobile/storage preservation. Existing eight-class and database browser regressions passed locally. Existing large-chunk build warning remains.
- Backend deployment: previous JAR backed up; fresh verified DB dump `portfolio_blog_20261016T034036Z.dump`. Initial legacy script could not identify the systemd-owned process; corrected to the OPERATIONS.md service restart. New local health and live official activity endpoint pass. No schema/configuration changes.
- Official item endpoint probes returned 404; do not treat unofficial API-library documentation as a working source. Mapping and recipe/combat semantics blockers remain; this is incremental implementation, not full-site completion.

운영 검증 추가: `945ccf7` 배포 `portfolio-blog-hpq8hmapn-xxjuon-4682s-projects.vercel.app` Ready 및 운영 도메인 연결 확인. 운영 보관함·제작법 연결·Steam 오류 처리·8직업 통합 검사 통과, 실제 Steam API와 UI 응답 확인. ESLint 통과. 모바일 스크린샷에서 새 패널이 탭보다 위에 배치된 문제를 발견해 기존 탭 콘텐츠 위치로 옮겼다. 배치 위치 회귀 단언을 추가했고 보관함·Steam 브라우저 검사, 타입 검사·운영 빌드가 다시 통과했다.

#### Anonymous build link sharing (2026-10-16)
- [x] Add explicit sharing from the build-library tab. Share a bounded, versioned URL fragment containing only allocation fields. Project character/search/history/gear names/notes out of the payload; freeze the selected gear mode's effective skill bonuses into manual bonuses. Existing full-fidelity JSON exports remain unchanged.
- [x] Add an isolated read-only share route, class-specific bundled data loading, skill/specialization/node display, point totals, version mismatch notice and explicit JSON download. Opening or downloading a shared build never writes localStorage, selects a persisted class, calls a character API or applies a build.
- [x] Reject unsupported schema/class, extra payload fields, nonnumeric IDs, bad budgets, duplicate IDs, malformed UTF-8/base64/JSON, unknown catalog references and payloads longer than 24,000 encoded characters. Show retry and manual-copy fallback.
- Validation: 18 frontend test suites passed, including all 8 classes × 3 equipment modes with identical final skill levels/point totals and private-field removal. TypeScript, ESLint and production build passed. Browser sharing, storage preservation, JSON download, version/malformed/reference failures, cross-class loading, zero API requests and 390px layout passed; existing library and eight-class integration passed. Initial typecheck failure for string indexing was corrected with a literal-key union. Existing chunk-size/plugin-timing warnings remain.
- This implements direct link sharing only. It does not create an indexed public build directory, rankings or verified new combat formulas. Official mapping/crafting/combat-data blockers remain unchanged.

공유 기능 운영 검증: `c688810`, Vercel `portfolio-blog-l8mu1jmjq-xxjuon-4682s-projects.vercel.app` Ready 및 `juhyeonl.dev` 연결 확인. 운영 공유 링크·보관함·8직업 통합 브라우저 검사 모두 통과했다. 클립보드 거부 시 직접 복사, 실제 선택된 특화 설명, JSON 다운로드, 저장 보존, 오류 링크/참조, 모바일 폭을 확인했다. 페이지 오류와 계획 업로드 요청은 없었다. 백엔드/DB는 이번 작업에서 변경하지 않았다.

#### Moderated public build directory (2026-10-16)
- [x] Add Flyway V13 `shadowcraft_public_builds` with bounded title/description, anonymous share payload, published flag, revision and timestamp. Reuse existing ADMIN authorization; no visitor write endpoint or new authentication system.
- [x] Public class/title filtering, stable 20-row pages and ID detail URLs; drafts/deleted records are unavailable publicly. Validate payload references against the class catalog, reject private/unknown fields, enforce UTF-8/body limits and optimistic update/delete conflicts. Public responses use no-store so unpublishing is checked on the next request.
- [x] Add `/admin/a2bc-builds` for create/edit/publish/unpublish/delete using existing blog auth. Preserve form contents after failed saves. Public listing and detail preserve all local plans; existing share view handles read-only download. No sample builds were published in production.
- [x] Fix fixed-sidebar overflow discovered by the existing integration test: all navigation entries remain reachable by scrolling as tools grow or screen height shrinks.
- Validation: backend 24 tests, frontend 19 suites, TypeScript, ESLint and build passed. Public/admin browser coverage includes filters, malformed response/retry, plain-text rendering, draft/publish/conflict/delete, read-only detail/404, mobile/storage preservation. Existing sharing and eight-class integration passed after sidebar fix. An initial React lint issue was fixed by associating list results with query state; a transient ambiguous status selector was narrowed.
- Backend deployed with verified DB backup `portfolio_blog_20261016T050154Z.dump` and previous JAR preserved. Flyway V13 success, health/public listing 200, anonymous write 403. Hashes of posts/projects/resume_sections/tags/post_tags/project_screenshots are identical before/after.
- Research: official `/api/ranking/list` responds 200 with empty rankingList and null season for one valid EU server and types 1,3,21. Recorded `operations/global-ranking-probe.json`; not evidence of a usable ranking population or universal unavailability. Map-overlay NOTICE attributes markers to older community data; not accepted as current official Global coordinate proof.

- Published `ee59195`: Vercel production Ready (`portfolio-blog-oy59d9mbe-xxjuon-4682s-projects.vercel.app`). Production public/admin fixture acceptance, existing share acceptance and eight-class integration passed. Unmocked production listing shows a valid empty result at 390px. No real builds were published for testing. Remaining full-completion conditions remain the verified official schemas/semantics and actual global ranking/status data described in the report.

#### Official skill prose, combo references and effect extraction (2026-10-16)
- [x] Regenerate the Global client index from build 25926599: 280 official English skill descriptions, 108 trait descriptions and 296 resolved combo-recipe links. Keep dynamic formulas visibly unresolved, not fabricated numbers; retain source hashes and old-v1 compatibility.
- [x] Render official prose as plain text and support forward/backward combo-recipe navigation without changing stored builds or attempting probability calculations.
- [x] Extract SkillEffect (31,629), SkillAbnormalEffect (12,771), SkillEffectLv (78,564) directly from installed Global files. Research outputs retained outside the application; hash/count/reference audit committed. All 218 se, 209 se_dmg and 302 abe unique references in playable descriptions match rows. This validates identity, not value semantics or combat formulas.
- Validation: 60 Python operations tests, 19 frontend suites, TypeScript, ESLint, production build, client database browser acceptance and eight-class integration passed. Existing >500 kB chunk warning remains. Initial Abnormal.dat filename was absent; corrected using schema names. Sandbox-local Vite binding failed; approved local execution succeeded on 5174.
- Remaining: interpret dynamic effect fields/level overrides, map projection, crafting probability/fees and other previously recorded full-site requirements. No whole-project completion claim.

운영 검증: `c28cce4`, Vercel `portfolio-blog-bzoqgxiht-xxjuon-4682s-projects.vercel.app` Ready 및 `juhyeonl.dev` 연결 확인. 운영 데이터베이스 브라우저 검사에서 공식 설명·제작 결과 양방향 이동·재료 계산·오류 재시도·390px 화면·저장 보존 통과. 원본에서 재생성한 인덱스는 커밋 파일과 바이트 단위로 일치한다.

#### Base effect formatting and second official terrain (2026-10-16)
- [x] Resolve 592 explicit se/abe localization references from the installed Global SkillEffect/SkillAbnormalEffect tables. Preserve exact decimal formatting, reference/value provenance and source hashes. Display base-client scope; do not evaluate damage/heal formulas or claim level/gear/spec adjustments. 94 of 280 skill descriptions now have no unresolved tokens; 447 tokens across descriptions/traits remain unresolved.
- [x] Replace the planner's external skill-description navigation with an internal official Global detail action. Selecting a skill resets only the database view, never the saved build.
- [x] Extract and package 64 Altgard terrain tiles from the same Global Steam build. Verify 112 seams (maximum RGB mean difference 10.828776), hashes and dimensions; retain the Verteron review tolerance separately. Altgard exported mip is 1024px although its settings say 2048px; record actual image dimensions and the original settings hash.
- [x] Add lazy Verteron/Altgard selection, resetting viewport/error state per region. Preserve user-map progress. Neither terrain claims world-marker projection.
- Validation: Python 67, frontend 19 suites, backend 24, TypeScript, ESLint, build; official database, two-region terrain and eight-class browser tests passed. Existing large-chunk warning remains. Initial Altgard dimension assumption was rejected and corrected after inspecting all 64 PNGs; map selection accessibility naming was fixed after browser failure.
- Runtime mapping investigation: user explicitly approved local game-memory analysis. Tools and output are isolated outside the repository; no memory data is uploaded. Results are recorded separately; completion of the mapping is not assumed from authorization.

메모리 매핑 조사 결과: 관리자 권한 jmap 직접 읽기는 `0x8007012B`, Microsoft 서명 ProcDump 11.1/12.02 복제 방식 및 12.02 단일 캡처는 `0x800707D1`로 실패했다. 덤프·새 매핑 파일은 생성되지 않았다. 복제 실패 직후에는 대상 프로세스가 조회됐지만 단일 캡처 후 최종 확인에서는 조회되지 않았다. 종료 원인과 도구 실행의 인과관계는 확정하지 않는다. 반복 실행을 멈췄고, 결과만 `operations/runtime-mapping-attempt.json`에 기록했다. 원본 메모리나 계정 정보를 Git/외부로 전송하지 않았다.

운영 검증: `97b256a`, Vercel `portfolio-blog-n70414wvb-xxjuon-4682s-projects.vercel.app` Ready 및 운영 도메인 연결 확인. 운영 데이터베이스·두 지역 지형 브라우저 검사 통과(각 지역 64개 타일 성공 응답, 기본 수치, 상세 이동, 오류 재시도, 저장 보존). 효과 테이블을 포함해 재생성한 인덱스는 커밋 파일과 바이트 단위로 일치했다.

#### Explicit effect growth reference audit (2026-10-16)
- Extracted SkillAbnormalEffectLv directly from installed Global files: 16,751 rows. Retained research JSON outside the application alongside the prior 78,564 SkillEffectLv rows.
- Added reproducible audit of direct se/se_dmg/abe references in the 280 playable skill descriptions and traits. Shared Skill/English/base-effect inputs must match the shipped index hashes. Growth tables have independent recorded hashes; extraction establishes their build provenance.
- 296/423 unique general effect references and 188/302 abnormal effect references have explicit growth groups; all resolve, with no internal level gaps. Remaining 127/114 have no explicit group. This is not evidence that their final values are level invariant. Nested references are excluded explicitly.
- Validate positive unique row IDs, unique group/level pairs and bounded levels; missing base references or snapshot mismatch fail. Missing growth groups are reported and return nonzero. No inferred fallback, interpolation, damage formula or live level application added.
- Validation: Python 73 tests, frontend 19 suites and production build passed. Existing chunk-size/plugin-timing warnings remain. No application, database, saved plan or runtime-memory changes.
- Remaining evidence: establish replacement/additive semantics and which effective skill level selects each row, including specialization/gear overrides, against authoritative behavior or controlled in-game samples. New runtime mapping remains unavailable; this audit does not complete the overall project.

#### Quest rewards and journal recommendations (2026-10-16)
- Linked all 1,321 QuestReward group IDs to quests, resolving every explicit reward item against the installed Global Item table. Display experience and separate base, normal and choice candidates. 108 quests without reward rows remain explicitly unknown; 340 random groups remain unexpanded, without fabricated odds.
- Extracted QuestClassReward (112 rows / 14 quests / 8 classes) from the same installed Global build. Display class-specific reward sections separately; do not merge all classes into a player's rewards. Source hashes include both reward tables and Item.
- Display quest unlock/recommended levels and presence of additional conditions, plus dungeon recommended levels, member ranges and difficulty. Zero is unspecified; recommendations do not establish admission or live availability. Preserve v1 compatibility and all saved plans.
- Validation: Python 77 tests, frontend 19 suites, typecheck, ESLint, build and journal browser acceptance passed. Eight-class integration passed. Existing bundle-size/plugin-timing warnings remain. No backend/database changes.

#### Six-region official terrain coverage (2026-10-16)
- Extracted and visually reviewed Poeta (4×4), Ishalgen (5×5), Chaotic Lower Reshanta (4×4) and Chaotic Middle Reshanta (2×2), all from Steam build 25926599. Names match Map IDs 1000, 1100, 20 and 22 respectively.
- Package 61 additional 1024px tiles (3,901,684 bytes); retain source hashes, decoded settings hashes, actual dimensions and seam measurements. Reviewed max RGB seam differences: 15.712891, 7.926107, 14.712240 and 5.143229. Existing region thresholds unchanged.
- Six-region selection reuses isolated lazy viewer state; 189 tiles total. World projection and marker support remain unverified/disabled. Static client content does not establish live availability. Source PNGs/settings archived outside the application.
- Public official character JS inspection confirms the documented item request path but provides no Global ranking-list implementation. The attempted Global ranking page redirects to official 404. Earlier API empty samples remain inconclusive; no fabricated leaderboard added.

확장 작업 검증: Python 78개, 프런트 19묶음, TypeScript, ESLint, 운영 빌드, 퀘스트 보상/직업별 보상/권장 정보 브라우저 검사, 6지역 지형 브라우저 검사, 기존 8직업 통합 검사 통과. 기존 대형 청크·플러그인 처리 시간 경고 유지.

운영 검증: `549a0c2` 배포 `portfolio-blog-g6iffjpub-xxjuon-4682s-projects.vercel.app` Ready 및 `juhyeonl.dev` 연결 확인. 운영 퀘스트/직업별 보상·6지역 지도·8직업 통합 브라우저 검사 통과. 운영 journal-index는 로컬 재생성 파일과 SHA-256 `2a2b713de32cfe71daeb26c8bdc1d4f3c2b95d0adb9edba8ef873e0354b59485`로 일치한다. 백엔드 기존 24개 테스트도 재실행해 통과했다. 신규 서버상태 후보 axsddlr/aion2_api는 README의 Caveats에서 Gaming.Tools HTML 수집을 명시하므로 공식 수집 경로로 채택하지 않았다.

#### Runtime preflight diagnosis (2026-10-16)
- Inspected pinned patternsleuth source: live image probing reads the entire module in one call. Installed PE SizeOfImage is 427,352,064 bytes; a partially inaccessible region is a candidate explanation, not a confirmed target observation.
- Added metadata-only Windows preflight (fixed Global Steam executable selection; no memory-content read/write/dump, no page protection change). 64-bit self-test passed: page classification, invalid PID and complete five-region/499,712-byte coverage.
- Latest AION2 process count is zero. No further target-memory attempt has occurred. Scoped Application crash events 1000/1001 around the earlier failed capture returned zero matching records; exit causality remains unknown. Awaiting game availability for actual target preflight.
