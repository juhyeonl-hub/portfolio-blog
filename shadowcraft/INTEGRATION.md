# a2bc — aion2(Steam) build craft

완료 기준: 사용자가 2026-10-15 확정한 범위. **개인 데이터 이전 불필요, 공식 공지만 자동 갱신, 카탈로그는 검토된 JSON으로 수동 갱신, Git 반영.**

운영 URL: https://juhyeonl.dev/lab/shadowcraft/

## 제품과 보존 범위

- 아이온2 Steam 글로벌 8직업 PvE 포인트·스티그마·데바니온 추천, 기본 투자/장비 보너스 분리, 현재/목표 장비 비교를 제공한다.
- 이동·생존기는 수동 분리를 유지한다. 추천은 예산 내 휴리스틱이며 최고 DPS·최신 메타를 증명하는 최적화기가 아니다.
- 이미지 OCR은 브라우저 worker와 로컬 한국어·영어 모델로 처리한다. 붙여넣기/파일/드롭/crop/취소/수정·확인 후 등록을 지원하며 이미지를 업로드하지 않는다.
- 익명 기기 저장: 직업별 계획 1개, 최근 캐릭터 최대 8개. 계정 동기화나 캐릭터별 독립 저장 슬롯은 제공하지 않는다. 공용 브라우저에서는 저장 내용을 공유한다.
- 원래 localStorage 키와 `shadowcraft-v1` JSON 형식, 경로 `/lab/shadowcraft/`를 유지한다. 내보내기/가져오기로 장비·검색 조건·포인트·캐릭터를 이전할 수 있다.
- 손상된 JSON·잘못된 장비/특화·캐릭터 배열은 저장 전에 거부한다. 저장 차단 시 편집은 계속되고 실패 상태를 표시한다. 캐릭터 부분 응답은 경고하며 직접 입력한 계획을 유지한다.
- 원본 카탈로그/공지/최근 기록과 아이콘·OCR 자산을 보존했다. ZIP 454개 파일을 크기/SHA-256으로 검증했고 이식한 자산·서버 스냅샷 290개도 원본과 일치했다.
- 원본 소스 커밋: `8ec574b258d3c689a3d1f0ead7e8b6f3fdad17a9`. 원본 요구사항은 [HANDOFF.md](HANDOFF.md), 원본 파일 목록은 [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json).

## 배치와 인증

별도 Vite HTML이 플래너 CSS를 분리한다. 블로그 Lab에서 연결하며 기존 블로그 UI·API·DB·게임은 유지한다.

| 구성 | 위치 |
|---|---|
| HTML/React/계산 | `frontend/lab/shadowcraft/index.html`, `frontend/shadowcraft/` |
| 게임/OCR 자산 | `frontend/public/shadowcraft/` → `/shadowcraft/game/`, `/shadowcraft/ocr/` |
| Spring API/저장소 | `ShadowcraftController`, `ShadowcraftService` |
| 공지 작업 | `ShadowcraftNewsUpdater` |
| DB | V12 `shadowcraft_catalogs`만 추가. 기존 테이블/개인 계획에는 쓰지 않음 |
| 수동 가져오기 | `shadowcraft/operations/sync.mjs`, `catalog-import.mjs` |

| API | 정책 |
|---|---|
| GET `/api/public/shadowcraft/catalog?class=assassin` | DB 저장본 또는 동봉 스냅샷. 공지 자동 확인 정책과 마지막 성공 시각 포함 |
| POST `/api/public/shadowcraft/armory` | 지역/직업/서버/이름 검증, 입력 2KB, 전체 120요청/분·동시 8개, 고정 공식 upstream·5분 캐시 최대 100개 |
| PUT `/api/admin/shadowcraft/catalog/{classKey}` | 기존 `ADMIN` 인증. 최대 3MB, 직업·스킬·특화·비용·보드·노드·레벨 스키마 검증 후 트랜잭션 저장 |
| PUT `/api/admin/shadowcraft/news` | 기존 `ADMIN` 인증. 최대 1MB, 잘못되거나 빈 공지는 이전 데이터 유지 |

Sites의 사용자 주입 헤더를 신뢰하지 않고, 서버 개인 Plan API는 노출하지 않는다. 관리자 자격증명은 프런트·문서·커밋·로그에 넣지 않는다. `.vercelignore`는 개인 컨텍스트·백엔드·운영 자료를 프런트 업로드에서 제외한다.

## 갱신 운영

**공식 공지:** 운영 프로필에서 서버 시작 약 10초 뒤, 이후 작업 완료 후 15분 간격으로 고정 NCSoft 공식 공지 API를 조회한다. 인증키·외부 작업 서비스는 필요 없다. HTTP 오류/타임아웃/1MB 초과/JSON·항목 형식 오류 시 이전 공지를 유지한다. 카탈로그나 추천 검토 상태는 바꾸지 않는다. `A2BC_NEWS_REFRESH_ENABLED=false`로 끌 수 있다. 개발·테스트에서는 기본 비활성화된다.

**카탈로그:** 자동 수집하지 않는다. 사용자가 허가 없음/수동 갱신을 선택했고, [Gaming.Tools 이용 조건](https://gaming.tools/pages/terms-and-conditions)은 자체 콘텐츠의 대량 복제·재배포 등에 관한 허가 조건을 명시한다. 기존 자동 HTML 수집 코드는 제거했다. 이 문서는 게임 자산의 재배포 권리를 증명하는 문서가 아니다. 기존 비공개 Sites와 그 정기 작업은 변경하지 않았다.

검토한 로컬 파일은 카탈로그 객체 또는 `{ "catalog": ... }` 형태로 준비한다. 현재 블로그 관리자 JWT는 `SHADOWCRAFT_ADMIN_TOKEN`, 또는 운영자의 API 키는 `A2BC_API_KEY` 환경변수로 로컬에서만 제공한다. `SHADOWCRAFT_ORIGIN` 기본값은 `http://127.0.0.1:8081`이며 원격 사용 시 HTTPS origin을 지정한다. 실제 값은 출력하거나 기록하지 않는다.

```bash
node shadowcraft/operations/sync.mjs assassin --file /path/to/reviewed-catalog.json
```

8개 classKey를 지원한다. 잘못된 파일/직업/크기/인증은 실패한다. 변경 감지 시 `reviewRequired`를 누적하며 수집이나 수동 가져오기만으로 추천 검토 완료로 바꾸지 않는다. 화면은 실제 `baselineVersion`과 데이터 버전을 구분해 표시한다.

## 검증

```bash
cd frontend
npm ci --ignore-scripts
npm run typecheck:shadowcraft
npm run lint
npm run test:shadowcraft
npm run build
cd ..
node shadowcraft/tests/catalog-import.mjs
mvn -f backend/pom.xml package
```

이 실행 환경은 Mockito의 JVM 자동 연결이 제한되어 `-DargLine=-javaagent:/home/juhyeonl/.m2/repository/org/mockito/mockito-core/5.14.2/mockito-core-5.14.2.jar`를 사용했다. 서버 17개 테스트가 통과했다. 수동 가져오기 검사는 8직업/인증/크기/스키마/실패 시 보존을 확인한다.

Python Playwright/Chromium이 설치돼 있으면 아래 5개 브라우저 검사를 실행한다. 기본 대상은 로컬 Vite 5173이며, 운영 검증은 다음처럼 지정한다. 새 브라우저 컨텍스트를 사용하므로 사용자 저장소를 수정하지 않는다.

```bash
SHADOWCRAFT_TEST_URL=https://juhyeonl.dev/lab/shadowcraft/ python3 shadowcraft/tests/integration.py
SHADOWCRAFT_TEST_URL=https://juhyeonl.dev/lab/shadowcraft/ python3 shadowcraft/tests/storage.py
SHADOWCRAFT_TEST_URL=https://juhyeonl.dev/lab/shadowcraft/ python3 shadowcraft/tests/ocr.py
SHADOWCRAFT_TEST_URL=https://juhyeonl.dev/lab/shadowcraft/ python3 shadowcraft/tests/ocr-inputs.py
SHADOWCRAFT_TEST_URL=https://juhyeonl.dev/lab/shadowcraft/ python3 shadowcraft/tests/review.py
```

| 수용 기준 | 검증 |
|---|---|
| 8직업 전환·데이터·저장 복원 | 원본 카탈로그/스키마/아이콘/예산 검사, Chromium 직업별 편집·새로고침 |
| 서버·검색·프로필·최근 목록 | 고정 응답과 실제 5개 지역 조회. EU/NAE/NAW/LA에서 스킬 35개와 보드 조회 성공. AS 일부 프로필은 스킬 목록을 비워 반환하여 누락 안내·계획 유지 |
| 예산 초과 금지·장비 중복 방지·15↔16 특화 | 계산 테스트, 브라우저 추천 적용 |
| OCR 전체 입력·취소·crop·수정 확인 | 실제 OCR worker/model, 실제 Ctrl+V/클립보드 버튼/드롭, 문양 폭발 +1 인식, 등록 후 복원 |
| 이미지 미전송 | OCR 검사 중 POST/PUT 0개, 자산 GET만 발생 |
| 저장·새 탭·초기 실패/지연·저장 차단 | 브라우저 실패 주입과 PlanMemory 회귀 검사 |
| JSON 이전과 독립 저장 슬롯 구분 | 장비·캐릭터·검색·포인트 완전 일치 roundtrip, UI에 직업 공통 계획 안내. 사용자 개인 데이터는 없다고 확인하여 실데이터 이전 불필요 |
| 비인가 갱신/타인 계획 차단 | 익명/USER/위조 Sites 헤더 403, 개인 서버 Plan API 없음 |
| 데이터·공지 오류와 검토 상태 보존 | 서버 스키마/HTTP 차단/잘못된 응답/검토 플래그 테스트, 실제 수동 가져오기 성공 |
| 모바일/하위 경로/새 창/압축 | 390px·1440px, 전용 HTML·아이콘·worker·embedded WASM JS·gzip MIME·SHA-256, 운영 HTTPS OCR |

## 운영과 기록

### 지도 화면 추가 (로컬 구현, 미배포)

`지도 & 수집` 탭은 사용자 좌표 파일의 검색·분류 표시·완료 숨기기·확대/이동을 지원한다.
공식 지도 이미지와 좌표는 아직 연결하지 않았으며, 기본 상태는 비어 있다.
배경 없는 좌표 보기임을 화면에 명시한다. 가져온 데이터는 항상 공식 검증 안 됨으로 표시한다.
지도 드래그와 방향키 이동, 버튼 확대/축소, 마커 Enter/Space 선택 및 동일 기능의 목록을 제공한다.

파일은 서버로 전송하지 않는다. 지도 자체는 메모리에만 보관한다.
완료 체크는 정규화된 파일 전체의 SHA-256을 붙인 `a2bc-map-progress-v1:` 키에 저장하며,
같은 파일을 다시 가져오면 복원한다. 좌표·버전 등 내용이 바뀌면 별도 진행도로 취급한다.
마커·분류 순서가 바뀌어도 다른 파일 내용으로 취급한다. 진행도는 직업 공통이며 기존 빌드 키는 사용하지 않는다.
저장소가 차단되면 현재 화면에서만 체크한다. 저장 데이터가 손상되었으면 덮어쓰지 않고 안내한다.

입력은 최대 2 MB, 분류 1~50개, 마커 최대 5000개다. 좌표는 왼쪽 위 `(0,0)`, 오른쪽 아래 `(1,1)`을
기준으로 한다. 아래 예시는 **합성 검사용이며 실제 게임 위치가 아니다**.

```json
{
  "schema": "a2bc-map-v1", "region": "global", "coordinates": "normalized-top-left",
  "id": "synthetic", "name": "Test map", "version": "Synthetic example — not game data",
  "categories": [{"id": "test-resource", "name": "Test resources"}],
  "markers": [{"id": "test-point", "name": "Test point", "categoryId": "test-resource", "x": 0.25, "y": 0.5}]
}
```

검증: `frontend`의 `npm run test:shadowcraft`에 지도 단위 테스트를 포함한다.
로컬 Vite 실행 후 루트에서 `python3 shadowcraft/tests/map.py`로 브라우저 수용 검사를 실행한다.
`SHADOWCRAFT_TEST_URL`로 테스트 주소를 지정할 수 있다.

### 제작 화면 추가 (로컬 구현, 미배포)

`제작 계산기` 탭에 레시피 검색, 목표 수량, 보유량·단가, 중간 재료 직접 제작/구매 선택,
구매 목록·제작 순서·잉여량·수수료·총비용을 추가했다. 공식 글로벌 제작법은 아직 미확보이므로
기본 목록은 비어 있다. 사용자 파일은 항상 **공식 검증 안 됨**으로 표시하며 파일의 출처 주장으로 이 표시를 바꾸지 않는다.
확률 성공·부산물·최저가 레시피 자동 선택은 지원하지 않는다.

제작 입력은 메모리에서만 유지한다. 탭 이동은 보존하지만 새로고침·직업 변경 시 초기화한다.
기존 빌드 저장 키/JSON 형식은 변경하지 않는다. 잘못된 파일을 읽으면 현재 목록·계산 입력을 유지한다.
파일은 서버에 전송하지 않는다.

수동 가져오기 계약은 아래와 같다. 이 예시는 **합성 검사용 데이터이며 실제 게임 레시피가 아니다**.
파일은 UTF-8 JSON, 최대 2 MB, 아이템 최대 3000개, 레시피 최대 500개다.
아이템별 레시피는 하나만 허용하며 재료 ID는 모두 `items`에 있어야 한다.
수량과 수수료는 안전한 범위의 정수이며 수수료와 사용자 단가는 동일한 통화의 최소 단위를 사용한다.

```json
{
  "schema": "a2bc-crafting-v1",
  "region": "global",
  "version": "Synthetic example — not game data",
  "items": [{"id": "test-tool", "name": "Test tool"}, {"id": "test-ore", "name": "Test ore"}],
  "recipes": [{"id": "test-recipe", "itemId": "test-tool", "outputQuantity": 1,
    "ingredients": [{"itemId": "test-ore", "quantity": 2}], "feePerCraft": 3}]
}
```

검증: `frontend`에서 `npm run test:shadowcraft`, `npm run typecheck:shadowcraft`, `npm run build`.
로컬 Vite 실행 후 저장소 루트에서 `python3 shadowcraft/tests/crafting.py`로 Chromium 검사를 실행한다.
합성 데이터로 정상 계산·미확정 가격·파일 오류 보존·비글로벌 파일 거절·탭 이동·모바일 폭·빌드 저장 보존을 확인한다.

화면은 Vercel, API·DB는 PC의 WSL2와 Cloudflare Tunnel에서 실행한다. 자세한 운영·가동 조건은 [OPERATIONS.md](../OPERATIONS.md)를 따른다.

- 최종 작업 전 DB 백업: `/home/juhyeonl/portfolio-blog-ops/backups/portfolio_blog_20261015T151118Z.dump`, `pg_restore --list` 검증 통과.
- 이전 JAR: `/home/juhyeonl/portfolio-blog-ops/blog.jar.before-shadowcraft-20261015T151949Z`.
- 공지 자동 갱신 JAR SHA-256: `b50b063e397d030cc2ce2a305102c3151546e111666dd020c64461561361b81c`.
- Flyway V12 유지. 게시글·프로젝트·스크린샷·이력서·태그 지문이 배포 전후 모두 일치했다.
- 공지 작업의 실제 성공 시각 `2026-10-15T15:14:16Z` 확인. 관리자 키를 출력하지 않고 기존 살성 파일의 수동 가져오기 성공 확인.
- 최종 프런트 운영 배포: `dpl_RbvvR4F1RQVJ2MS3ZVkSrTRWawir` (READY). 운영 브라우저 검사 5개 모두 통과.
- OCR 라이선스/NOTICE와 게임/데이터 출처 표기를 유지한다. 모든 캐릭터가 완전한 정보를 공개하는 것은 아니다. 브라우저 데이터 삭제/시크릿 모드에는 JSON 백업이 필요하다.
- 블로그/플래너의 500kB 이상 chunk 경고는 남아 있다. 플래너는 gzip 약 64kB이고, 이번 마무리에서 블로그 전체의 코드 분할은 변경하지 않았다.

### Global client index

`frontend/public/shadowcraft/data/client-index.json` is a narrow, read-only export from the installed Global Steam client (app 3393110, build 25926599). It includes item names/classifications, playable skill names, and recipe material requirements. It does not establish live availability, complete combat semantics, success rates or fees. Existing planner catalogs retain their original provenance.

Regenerate only from reviewed, strictly decoded Global records:

```sh
python3 shadowcraft/operations/build-client-index.py DECODED_TABLE_DIR ENGLISH_JSON STEAM_BUILD_ID frontend/public/shadowcraft/data/client-index.json EFFECT_TABLE_DIR
python3 shadowcraft/operations/compare-client-planner.py DECODED_TABLE_DIR frontend/shadowcraft/lib/data/catalogs
python3 -m unittest discover -s shadowcraft/operations -p 'test_*.py' -v
cd frontend
npm run test:shadowcraft
npm run typecheck:shadowcraft
npm run build
```

The UI validates records/references before display, loads only when the database tab is opened, and retries failed loads. Recipe quantities mean **attempts**, not guaranteed production. Client decoding configuration/credentials and third-party decoder implementations are not bundled. Browser acceptance: `SHADOWCRAFT_TEST_URL=http://127.0.0.1:5173/lab/shadowcraft/ python3 shadowcraft/tests/client_database.py` from repository root.

2026-10-15 deployment: implementation commit `d30cfd6` pushed to main; Vercel production deployment `portfolio-blog-gf4gwxo4r-xxjuon-4682s-projects.vercel.app` reported Ready. Production `client_database.py` and existing `integration.py` passed, including eight-class storage isolation, export/import roundtrip, OCR asset paths, mobile layout and no plan-upload requests. This publishes the validated incremental tools; it does **not** complete official planner catalog replacement, probabilistic crafting or an official map with aligned markers.
The deployed client index SHA-256 matches the committed export. An unmocked production browser API fetch returned 200, assassin/35 skills and enabled news refresh; a standalone Python HTTP probe returned 403 while curl and local backend checks returned 200. The Python-only discrepancy remains unexplained.

The client index also reads `SkillAcquireData.json` and records its hash. Skill details show 3840 per-level learning rows; 104 have an ascension condition. Ascension is shown as the original client code (for example `AscensionGrade_3`), and is **not yet enforced by the existing planner**. The comparison tool reports these unmodeled rows separately. Missing/duplicate/discontinuous skill levels, class mismatches, invalid costs, and unsupported prerequisite/item conditions reject regeneration. Existing v1 exports without learning data still load, with an explicit missing-details state.

### Planner ascension confirmation

Supersedes the earlier display-only limitation: `AscensionGrade_3` now gates new manual investments and recommendations for 104 skills. The optional plan field `ascensionGrade3Confirmed` is an explicit user confirmation, scoped to the current class; missing legacy values are unconfirmed. Existing saved investment is preserved with a warning. A requested recommendation may remove gated investment after preview/apply; removing the confirmation alone does not change it. The code makes no assumption about the player-facing meaning of the enum's numeric suffix.

Regenerate the compact rule overlay after reviewing a new official index:

```sh
python3 shadowcraft/operations/build-ascension-rules.py frontend/public/shadowcraft/data/client-index.json frontend/shadowcraft/lib/data/ascension-rules.json
```

Unknown ascension codes reject generation and require explicit support. The generated file stores original source metadata and index SHA-256. `shadowcraft/tests/ascension.py` tests the browser flow using `SHADOWCRAFT_TEST_URL`; the frontend `ascension.mjs` suite covers all eight classes, first-acquisition prerequisites, recommendation, equipment bypass prevention and preserved legacy allocations.

### Official terrain images

The map tab includes **Verteron terrain** from the installed Global Steam build 25926599. It loads 64 tiles only when explicitly opened (about 3.8 MB total), and supports zoom, drag, arrow keys and failed-image retries. It is independent of imported maps and stored collection progress. NPC/collectible markers are not overlaid: world-to-image coordinates remain unverified. The source name is English client string `String_STR_Map_World_L_A_body`.

`frontend/public/shadowcraft/maps/steam-25926599/verteron/manifest.json` records raw/display tile hashes, map settings hash and 112 edge comparisons. Reproduction requires the reviewed raw PNGs, strictly decoded World_L_A metadata and Pillow in the operator environment:

```sh
python3 shadowcraft/operations/build-terrain-assets.py PNG_DIRECTORY WORLD_MAP_JSON NEW_OUTPUT_DIRECTORY frontend/shadowcraft/lib/data/terrain-catalog.json
```

Output must be a new directory. Missing tiles, unexpected dimensions/settings and seam differences exceeding the reviewed tolerance reject packaging. WebP conversion uses 1024px tiles at quality 85; this changes display encoding/resolution, not the map geometry. The recipe is pinned to this snapshot and must be reviewed before another build. Browser acceptance: `SHADOWCRAFT_TEST_URL=http://127.0.0.1:5175/lab/shadowcraft/ python3 shadowcraft/tests/terrain.py`.

### Verteron coordinate audit

Run against the locally decoded official Global Steam build 25926599 Data directory:

```sh
python3 shadowcraft/operations/audit-map-coordinates.py /path/to/AION2/Content/Data > /tmp/map-coordinate-audit.json
python3 -m unittest discover -s shadowcraft/operations -p 'test_*.py'
```

The checked-in `operations/map-coordinate-audit.json` records input hashes, all
16 axis/scale hypotheses, unresolved references, and per-anchor distances for
the two identity-axis candidates. It contains no game archive credentials.
The command only reads inputs and prints JSON; a successful exit means the
audit ran, **not** that projection was certified. Missing individual references
are explicit audit findings; no joins, duplicate identities, non-finite
coordinates and invalid polygon/sector inputs fail the command.

Of 72 enabled region references, 69 join successfully. The sector ratio
102000/1024 (99.609375) puts 65 labels inside their named subzone; scale 100 puts
64 inside. This does not prove either texture placement. Both projection and
marker-support flags remain false. Obtain independently verified texture
control points or reliable decoded tile transforms before adding world markers.

### Strict package research gate (2026-10-16)

The Verteron `.umap` preview previously returned partial JSON despite object
exceptions. Do not use that JSON to infer absent/default transforms. Diagnostics
found 121 StaticMeshComponent and 64 MaterialInstanceDynamic exception events,
and an AionWorldSettings object with 64 unread bytes. The precise mapping/reader
mismatch remains unresolved. The mapping file matches the October decoder copy.

Apply `operations/aion2-package-audit.patch` in the research CUE4Parse checkout
(pinned ec6595e46448a817ac21ea9bde01caa48f80a420 with the previously recorded
AION2 update). Apply `operations/uex-package-audit-exit.patch` in research uex
812e16238b41dd8ec31b0bd4b5ba23884f64e48c. Rebuild in Release mode. These are
local modifications to [CUE4Parse](https://github.com/FabianFG/CUE4Parse)
(Apache-2.0) and [uex](https://github.com/arkive-games/uex) (MIT), not application
runtime dependencies or copies of the third-party October decoder.

Set `A2BC_STRICT_PACKAGE_AUDIT=1` for fail-on-exception/incomplete consumption;
optionally set `A2BC_PACKAGE_AUDIT=1` to log object type/name and remaining bytes.
When invoking Windows dotnet from WSL, pass these names through WSLENV too:

```sh
A2BC_STRICT_PACKAGE_AUDIT=1 A2BC_PACKAGE_AUDIT=1 \
WSLENV="${WSLENV:+$WSLENV:}A2BC_STRICT_PACKAGE_AUDIT:A2BC_PACKAGE_AUDIT" \
'/mnt/c/Program Files/dotnet/dotnet.exe' src/Uex/bin/Release/net10.0/uex.dll \
  --config /private/path/to/profile.json preview --profile a2bc-global \
  AION2/Content/UI/Map/WorldMap/World_L_A/WorldMap_World_L_A.umap
```

Expected for the current reviewed mapping: exit 1, no JSON on stdout, and a
strict AionWorldSettings failure. Batch export must also exit 1 on errors.
Use a separate research output directory: batch export is not transactional,
and failed runs do not remove older output files. Always inspect the exit code
and summary before accepting artifacts. Keep profile credentials out of reports.
Byte completeness alone does not establish field semantics.

All 64 terrain textures passed strict extraction and reproduced the exact PNG
hashes used by the published manifest. See `operations/map-package-audit.json`
for counts and evidence hashes. Production terrain, saved builds and user-map
progress are unchanged. World-to-image projection remains unverified.

### Quarantined static-mesh layout probe

`operations/tile-layout-research.json` records a hypothesis, not an approved
mapping or runtime catalog. Changing only StaticMeshComponent's property count
from 33 to 34 made 121 static mesh component reads complete. The original
mapping still lacks a verified name/position for the extra slot; named properties
within the class were not repaired. Material and world-settings failures remain.

All 64 tile actors resolve to unique matching textures and root components.
Their centers follow `-3584 + 1024 * sectorIndex` on each axis within 0.001;
maximum observed error is approximately 0.0001. The tolerance accommodates
float32 roundoff rather than allowing a fitted or shifted grid. This is a
consistency check in map-scene coordinates, not proof of a game-world projection.

Reproduce the geometry portion using the archived quarantined JSON:

```sh
python3 shadowcraft/operations/audit-tile-layout.py /path/to/a2bc-gap-preview.json
python3 -m unittest discover -s shadowcraft/operations -p 'test_*.py'
```

The checked-in report additionally records diagnostic counts and SHA-256 hashes
of archived evidence. Research patches/logs are preserved outside the repo in
`a2bc-client-research/steam-25926599/october-decoded/map-probe/staticmesh-gap`.
The two experimental source modifications were removed from the active tool.
Do not enable this hypothesis for production exports: passing a geometry check
cannot validate unobserved fields, other packages, or gameplay coordinates.

### Official recipe attempts in the crafting tab

Open **공식 제작법 열기** to load the validated Global client index. Search by
English product name, item ID or recipe ID and select a recipe. Enter attempt
count (1–10,000), stock satisfying each displayed enchant requirement, and
integer purchase prices. Duplicate item/enchant requirements are aggregated;
different enchant requirements remain separate. Blank price means unknown,
including after stock deduction; a zero price is an explicit free purchase.

Outputs are direct required/owned/purchased materials and known purchase costs.
Success yield and fee-inclusive total remain unknown. Combo continuations and
probabilistic intermediate recipes are excluded. The client snapshot may contain
recipes not available on the live server. Inputs stay in this mounted tab only,
without uploads or localStorage writes, and reset on refresh/class change.
The existing imported deterministic recipe workflow is preserved.

Validation: `npm --prefix frontend run test:shadowcraft` includes the attempt
engine and all shipped recipes. Run `shadowcraft/tests/official_crafting.py`
with SHADOWCRAFT_TEST_URL for browser acceptance, alongside existing crafting
and integration tests. Both loading errors and malformed data offer retry.

### Verified compound board effects

The legacy catalogs retained only one numeric stat per node. The node inspector
now supplements 192 compound PvP nodes from official DaevanionNode records,
covering integer critical resistance, evasion and defense. Korean display labels
remain from the existing catalogs. `build-board-effects.py` validates 4,296
node layouts/costs/conditions and 704 skill-level increments before generating
`lib/data/board-effects.json`. Unknown fields, extra effect slots and mismatches
fail regeneration; this is not a full official catalog migration.

```sh
python3 shadowcraft/operations/build-board-effects.py /path/to/DaevanionNode.json frontend/shadowcraft/lib/data/catalogs frontend/shadowcraft/lib/data/board-effects.json
```

The runtime supplement requires matching catalog version, node ID/position and
primary stat key/value/format. Recommendations remain the existing heuristic;
no saved plan or catalog is rewritten. `board-effects.mjs`, Python generator
tests and `shadowcraft/tests/board_effects.py` cover validation and display.

### Official quests, dungeons and pets

Global Data now has an explicit-load quest/dungeon/pet browser. The snapshot
contains 1,429 quest identities and summaries, 733 dungeon/map references and
209 pets. VehicleList is the client's internal pet table: official English
UI_VEHICLE_TITLE and UI_VEHICLE_TAB_VEHICLE strings both say `Pets`.
The export joins 2,553 quest-step records, 400 acquisition NPCs and 424
completion NPCs; every referenced NPC, next quest and dungeon map exists.
It does not interpret reward groups, level gates, coordinates or combat stats.
Missing dungeon titles (25) are shown explicitly instead of invented.

```sh
python3 shadowcraft/operations/build-journal-index.py /path/to/decoded/Table /path/to/L10NString.json 25926599 frontend/public/shadowcraft/data/journal-index.json
SHADOWCRAFT_TEST_URL=http://127.0.0.1:5175/lab/shadowcraft/ python3 shadowcraft/tests/journal_database.py
```

The generator records hashes for Quest, QuestString, QuestStep, Dungeon, Map,
NpcData, VehicleList and English localization. Broken references and duplicate
IDs fail before output replacement. The browser validates the Global source,
loads only on request, supports retry, and writes no localStorage or backend data.
Research-only decoder sources and private configuration are not shipped.

### Mapping index coverage preflight

`operations/uex-mapping-audit.patch` adds an independent read-only inspection
command to the research CLI. Unlike archive extraction, it does not read a
profile or mount any game files:

```sh
uex mapping-audit AION2-5.3.2.0.usmap AionWorldSettings MaterialInstanceDynamic StaticMeshComponent > mapping-chains.json
python3 shadowcraft/operations/audit-mapping-coverage.py mapping-chains.json property-trace.log
```

Use a trace recorded with that exact mapping. A disagreement between recorded
and resolved property names/types fails instead of comparing mixed snapshots.
The current Verteron trace yields exit 1: index 24 is absent from the 21-slot
MaterialInstanceDynamic chain (64 events); StaticMeshComponent index 136 has
unsupported Unknown type (121 events). `mapping-coverage-audit.json` records
chains, event counts, mapping hash and input hashes. Full dumps remain outside
the application under `map-probe/mapping-coverage`.

Exit 0 means only that all observed indexes have mapped types. It does not
validate field semantics or package consumption: AionWorldSettings illustrates
this distinction, with covered indexes but 64 unread bytes in the strict audit.
Do not enable production projection or markers from this preflight alone.

### Named build library, recipe references and Steam activity

- **빌드 보관함**: each class has up to 20 local named snapshots at `a2bc-build-library-v1:<class>`. Applying a preview first saves the current plan as recovery. Entry export uses the existing `shadowcraft-v1` file format. Existing plan keys remain unchanged. Corrupt storage is not overwritten; storage failure prevents apply; Web Locks plus byte comparison protect concurrent tabs. Secure-context Web Locks support is required for writes. Browser data deletion still removes local snapshots; export important builds.
- **글로벌 데이터**: item details expose producing/consuming recipes; recipe material buttons navigate to item details using reviewed official IDs.
- **Steam 접속 현황**: `GET /api/public/shadowcraft/activity` reads official Steam `ISteamUserStats/GetNumberOfCurrentPlayers/v1/` for app 3393110. One-minute backend cache includes failed attempts; initial failure returns 502, later failure returns last known count with its original `checkedAt` and `stale:true`. No plan writes, accounts, DB migration or new credentials. This is the whole Steam app count, not per-server online status.
- Tests: `python3 shadowcraft/tests/build_library.py`, `recipe_links.py`, `steam_activity.py`; set `SHADOWCRAFT_TEST_URL` for production. Activity browser cases use controlled fixtures; verify the actual endpoint separately. Backend service cases are in `SteamActivityServiceTest`.
- Deployment uses **systemd `portfolio-blog`**, as documented in `OPERATIONS.md`; legacy ops `start.sh`/`stop.sh` PID files do not track the current service.

### Anonymous build links

빌드 보관함 → **현재 배분 공유 링크 만들기**에서 현재 배분의 고정 스냅샷을 만든다. URL의 `#build=` 뒤에 `a2bc-share-v1` JSON을 UTF-8/base64url로 인코딩한다. 인코딩 본문은 최대 24,000자이며 초과 시 기존 JSON 내보내기를 안내한다. URL 길이 제한으로 일부 메신저에서 잘릴 수 있다. 수신자는 읽기 전용 화면에서 배분과 데이터 버전을 확인하고 JSON을 다운로드할 수 있다. 적용은 기존 플래너의 명시적 JSON 불러오기를 사용한다.

캐릭터·검색 기록·장비 이름/메모는 공유하지 않는다. 선택 장비 모드의 스킬 보너스를 합산한 수동 보너스로 고정하므로 장비 목록을 편집하는 원본 백업 용도에는 기존 내보내기를 사용한다. 링크를 가진 사람은 배분을 읽을 수 있으며, 링크 생성 뒤 원본 수정이 기존 링크를 바꾸지는 않는다. 서버 저장이나 공개 검색 목록은 없다.

수신 화면은 브라우저 저장을 읽거나 쓰지 않고 번들 카탈로그만 사용한다. 버전 차이는 표시하고 미확인 스킬/특화/노드 참조는 거부한다. 전투 유효성이나 예산 적합성을 자동 승인하지 않는다. 공유 API/DB 마이그레이션/추가 의존성은 없다.

검증: `npm --prefix frontend run test:shadowcraft`, `python3 shadowcraft/tests/build_share.py` (`SHADOWCRAFT_TEST_URL`로 운영 URL 지정 가능).

### Public build directory and administration

- 방문자: **공개 빌드** 탭에서 직업·제목 검색, 20개 단위 페이지, `#published=<UUID>` 상세 링크. 기존 공유 화면에서 배분 확인/JSON 다운로드. 읽기만으로 로컬 빌드를 바꾸지 않는다.
- 관리자: 블로그 관리자 홈 → **a2bc Builds** (`/admin/a2bc-builds`). 플래너에서 만든 공유 링크와 제목/설명을 넣고 저장한다. 기본값은 비공개이며, ‘방문자에게 공개’를 체크하고 저장해야 공개된다. 체크 해제 후 저장하면 다시 숨겨진다. 삭제에는 확인과 최신 revision이 필요하다.
- 기존 ADMIN JWT/API key로 `/api/admin/shadowcraft/builds` GET/POST, `/{id}` GET/PUT/DELETE(`revision` 쿼리)를 사용한다. 공개 GET `/api/public/shadowcraft/builds?class=&q=&page=0` 및 `/{id}`는 공개된 레코드만 반환한다. 모든 쓰기는 서버에서 공유 스키마/개인정보 제외/카탈로그 ID/크기를 재검증한다.
- Flyway V13은 새 테이블만 추가한다. 기존 블로그/카탈로그 테이블을 변경하지 않는다. API 인증 설정·환경변수 추가 없음. 배포/롤백은 `OPERATIONS.md`의 systemd 절차를 따른다. 이전 JAR로 롤백해도 새 테이블을 삭제하지 않는다.
- 운영 목록은 아직 비어 있다. 테스트 데이터를 공개 콘텐츠로 자동 게시하지 않았다. 순위·조회수·사용자 작성자 정보를 만들어 넣지 않는다.
- 검증: `PublicBuildControllerTest` (기존 포함 백엔드 24개), 프런트 `public-builds.mjs` (전체 19묶음), `shadowcraft/tests/public_builds.py`의 격리된 관리자/공개 응답 검사. 실제 운영 DB에는 V13 적용과 공개 빈 목록·익명 쓰기 거부·기존 데이터 지문 보존을 확인한다.

### Base effect descriptions and Altgard (2026-10-16)

The optional final `EFFECT_TABLE_DIR` argument contains reviewed `SkillEffect.json` and `SkillAbnormalEffect.json` from the same Global build. Omit it only when deliberately generating unresolved prose. The shipped index resolves 592 explicit scalar field/formatter references; `resolvedReferences` records each token and formatted value. `valueScope=base-client-values` excludes skill-level overrides, gear, specializations and full damage/heal formulas. The original localization and both effect-table hashes are retained. Never evaluate arbitrary text expressions from game data.

The planner's official-description button opens the selected skill in our read-only database. Existing catalogs and allocations retain their prior behavior.

Package Altgard with the same terrain builder, passing its `World_D_A.json`, source PNG directory and a **new** output directory, plus `frontend/shadowcraft/lib/data/terrain-altgard.json` for display metadata. The builder selects only reviewed World_L_A/World_D_A identities, rejects missing/wrong-sized/discontinuous tiles and preserves prior output. Altgard's actual exported mip is 1024px (its settings declare 2048), with a separately reviewed seam threshold of 11/255; Verteron's threshold remains 10/255. Region changes remount the viewer to isolate pending image events, viewport and retry state. Neither map establishes world-coordinate projection.

Runtime research is authorized locally. Full usmap extraction remains unsuccessful; later targeted schema verification is documented below. `operations/runtime-mapping-attempt.json` records tool versions and sanitized error outcomes only. Raw dumps, research profiles, runtime data and third-party executables must remain outside this repository.

### Effect growth link audit

Run `python3 shadowcraft/operations/audit-effect-levels.py CLIENT_INDEX SKILL_JSON ENGLISH_JSON EFFECT_DIR OUTPUT_JSON`. EFFECT_DIR contains SkillEffect, SkillAbnormalEffect, SkillEffectLv and SkillAbnormalEffectLv JSON tables. Shared source hashes must match the shipped client index; independently retain extraction provenance for the two growth tables. The audit records their hashes, unique group/level checks, first/last observed levels, counts and internal gaps. It exits nonzero for missing growth groups and rejects missing base IDs or malformed identities.

The committed `operations/effect-level-audit.json` records 484 explicit linked references in build 25926599. It covers direct se/se_dmg/abe localization references only. No-explicit-group does not imply level invariance; a linked group does not establish replacement/additive semantics, level selection, damage formulas or live gameplay correctness. Research source tables remain outside the app.

### Expanded journal and terrain

Journal regeneration now also requires `QuestReward.json`, `QuestClassReward.json` and `Item.json` from the same Global snapshot. Validate all reward group/item/class references; retain null for absent reward rows. Separate experience/base/normal/choice candidates, class-specific rewards and unresolved random groups. Optional v1 reward/level/recommendation fields preserve compatibility with older indexes. Recommended dungeon values are not admission requirements.

The terrain builder supports six reviewed maps with per-region grid sizes and actual mip dimensions. Additional keys: World_L_Starter (Poeta, 4), World_D_Starter (Ishalgen, 5), Abyss_Reshanta_A (Chaotic Lower Reshanta, 4), Abyss_Reshanta_C (Chaotic Middle Reshanta, 2). Use their same-build settings JSON and PNGs with a new output directory. All four export 1024px mips despite settings declaring 2048px. Reviewed source overviews establish tile order only; do not infer marker projection.

### Runtime image metadata preflight

`operations/probe-runtime-image.ps1 -SelfTest` checks page classification, invalid PID rejection and complete metadata coverage of the calling 64-bit Windows PowerShell process. Without `-SelfTest`, it selects only the expected installed Global Steam AION2 executable. It uses `VirtualQueryEx` with `PROCESS_QUERY_INFORMATION`, outputs aggregate page metadata, and does not call ReadProcessMemory, create dumps, change protection or inject code. The existing user authorization covers local runtime investigation; the initial check had no running game; the subsequent logged-in probe is documented below.

The pinned jmap dependency [patternsleuth 1d90b02](https://github.com/trumank/patternsleuth/blob/1d90b02c7610b595f940af04ce97e0f6feb06923/patternsleuth/src/process/external.rs) reads the entire SizeOfImage in one ReadProcessMemory call. A non-readable region can explain a partial-read error, and the subsequent target probe confirmed unreadable regions. This does not establish the earlier process-exit cause. The installed PE declares 427,352,064 image bytes. Windows Application event IDs 1000/1001 in the previous attempt's narrow time window contained no AION2 crash record; that does not establish why the game exited. Do not rerun full dumps on the basis of this preflight alone.

API reference: [Microsoft VirtualQueryEx](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualqueryex). Self-test passed on 64-bit Windows PowerShell, with 499,712 image bytes covered by five readable regions. This is tool validation, not Global process validation or a recovered usmap.


### Verified map schema corrections and local region labels

The logged-in Global Steam session allowed a partial readable-image capture and bounded inspection of four explicitly named map class/struct definitions plus their inheritance (14 unique definitions). Both full jmap attempts failed, so this is not a complete replacement usmap. `operations/runtime-map-schema-audit.json` records sanitized hashes, field differences and strict package results. Raw memory, runtime traces, schema definitions and extracted packages remain outside Git under the private research directories.

`operations/uex-runtime-schema-corrections.patch` applies to the external Uex research checkout, not this application's dependencies. It is opt-in via `A2BC_RUNTIME_SCHEMA_CORRECTIONS`, requires the exact reviewed schema SHA-256, retains complex existing field types and rejects unreviewed additions/removals/type changes. Set the variable to the private `target-class-schemas.json`, and enable both `A2BC_STRICT_PACKAGE_AUDIT=1` and `A2BC_PACKAGE_AUDIT=1`. Never accept an export with missing coverage, parser errors or nonzero remaining bytes. The research tool has existing dependency vulnerability warnings and an optional native-build warning; it is not shipped to the blog.

All six `WorldMap_<mapKey>.umap` packages and their six explicitly linked design packages now decode completely: 1,267 objects, 1,273 audit events including referenced packages, zero unread bytes/errors. Explicit material/plane/texture links verify 164 centered tile placements across five regions. Ishalgen's 25 tiles have a translated origin; it is not silently treated as a centered map. None of these results establishes the gameplay-world projection.

Generate the four regions' map-local labels with:

```sh
python3 shadowcraft/operations/build-terrain-labels.py MAP_EXPORT_DIR WORLD_MAP_UI_REGION_JSON ENGLISH_JSON FIRST_TERRAIN_LOG OTHER_TERRAIN_LOG DESIGN_LOG > /tmp/terrain-labels.json
```

Review output before replacing `frontend/shadowcraft/lib/data/terrain-labels.json`. The builder checks complete zero-remainder object audit coverage, all 148 associated tile transforms and material bindings, explicit design-package links, exact region-name joins for map IDs 1010/1110/20/22, unique references and finite bounded map-local positions. Nine unlocalized authored names are explicitly omitted; 154 labels resolve across Verteron, Altgard and the two Reshanta maps. It does not guess missing names or apply a gameplay-coordinate transform. UI toggles and declutters labels while zooming, without touching saved plans or collection progress.


### Reflected crafting schema snapshot

The original research decoder schema contained inferred unnamed fields in CraftRecipe. Named native reflection now verifies all 34 recipe fields and nested candidate/component/date structures. Re-decoding succeeds for all 1,098 rows; the published ingredient IDs/counts/enchant requirements, output quantities, combo links and mastery fields are unchanged. Preserve the older export separately. The current client-index CraftRecipe input hash refers to the corrected export, archived under `a2bc-client-research/steam-25926599/runtime-crafting/decoded`.

Optional `craftType` (`Common`/`Succession`) and `successionCandidateItemIds` are emitted together, strictly validated and resolved against Item. There are 342 succession recipes; 190 name two candidate items each. Candidates are not automatically included in material totals. Missing candidates do not imply no target is needed. Never convert raw CraftRecipeRate `Rate` to a percentage or choose a `Gap` using an assumed formula. Both client fee fields being zero does not verify the server fee. `runtime-crafting-schema-audit.json` records these boundaries and table hashes. SkillEffectLv is byte-identical to the prior verified growth-table source.

## 제작 기본 확률 미리보기 (2026-10-16)
글로벌 데이터의 제작법 상세에서 숙련도 레벨 차이를 입력한다. 공식 클라이언트의 명시적 CraftRateGroup이 있는 622개 제작법만 지원한다. 원본 Rate/1,000,000 환산은 사용자 관측 57개 지점과 정수 부분이 일치하며, 화면은 소수점 둘째 자리까지 반올림한 **약** 값으로 표시한다. 476개 미연결 제작법에는 확률을 만들지 않는다.

표의 마지막 행을 넘어서는 차이, 음수, 소수, 빈 입력은 계산하지 않는다. 개인 숙련도의 등급별 환산·캐릭터 보정·연속 제작·수수료·실제 제작 가능 여부는 미적용이다. 기본 성공 확률과 시도 횟수별 재료 수량은 별개다. 기존 successRate 필드는 null로 유지하고 baseRateCurve를 선택 필드로 추가해 오래된 v1 파일도 읽을 수 있다. 재생성 입력 폴더에 검증된 CraftRecipeRate.json을 포함하면 각 원본 해시와 함께 생성된다.

### 등급·레벨 입력 추가
CraftMastery 원본의 Beginner 1~50 / Intermediate 51~100을 각각 입문(Novice) / 전문(Professional)으로 제공한다. 등급 내 레벨은 1부터 시작하며 전체 숙련도 = 구간 시작 + 입력 레벨 - 1, 기본 차이 = 전체 숙련도 - 레시피 요구치다. 사용자의 전문 Lv5 요구치 55 관측과 일치한다. 두 제작 화면에서 입력 방식을 선택할 수 있으며, 개인 보정은 적용하지 않는다. 음수 차이와 표 밖 차이는 보간·고정하지 않는다. 기존 직접 차이 입력도 유지한다.

## 2026-10-16 사용자 범위 축소 — 이전 제작 설명보다 우선
제작 계산기 및 데이터베이스 제작법/재료 연결 화면은 제품에서 제외했다. 원본과 모듈은 보존하며 기존 저장 데이터는 변경하지 않는다. 예상 전투/DPS, 실시간 순위표·서버 혼잡도도 완료 기준에서 제외한다. 지도 위치와 공개 캐릭터 세팅 참고가 후속 방향이며, 후속 사용자 정정으로 실제 피해 이벤트 기반 실시간 DPS는 포함한다. `tests/crafting.py`, `official_crafting.py`, `recipe_links.py`는 제거된 화면에 대한 역사적 수용 검사로 현행 릴리스 검사 대상이 아니다. `client_database.py`는 제작 진입점 부재와 아이템/스킬 조회 보존을 검사한다.

## Measured DPS local integration (2026-10-16)
User explicitly includes actual live DPS, excludes predictive DPS. Reference protocol: [A2Tools streaming](https://github.com/taengu/A2Tools-DPS-Meter#streaming-from-another-pc-obs), inspected commit `1f9398fac9ed7ac85731c304e5abec966489950c`, `src-tauri/src/stream_overlay/snapshot.rs` and `server.rs`. Upstream is GPL-3.0; no collector code, binaries or assets are bundled. This independently written adapter consumes the existing JSON endpoint.

The game PC runs A2Tools with streaming enabled, plus Python 3 `operations/dps-bridge.py`. Enter its stream port and key locally; the key prompt is hidden. The bridge generates a separate session key shown in its terminal. Enter that session key in the a2bc 실측 DPS tab. The bridge binds only 127.0.0.1:18732; the upstream is restricted to 127.0.0.1 with no proxy or redirects. Browser requests require the exact production Origin/Host and session key. Only fixed GET /snapshot is exposed; no capture or installation is performed by the bridge. CORS/private-network preflight is explicit.

Snapshot v1 contains target/mode/fight time and player name/DPS/damage/local-player flag. Preserve measured values, discard other fields, reject malformed/oversized data. UI polls only after connection and while the tab is mounted; failures mark the retained snapshot stale. No localStorage, backend upload or inferred missing damage. Displayed players and target mode follow the collector; this is not guaranteed complete raid-wide damage. Browser local-network permissions and the Python local process are required.

Tests use synthetic snapshots and are not live game evidence. A2Tools/Npcap were not found in the checked standard paths. Real Global combat measurement accuracy, collector setup and production-to-local transport remain pending actual setup. Installing the Windows capture driver is awaiting user confirmation.
