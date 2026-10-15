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
