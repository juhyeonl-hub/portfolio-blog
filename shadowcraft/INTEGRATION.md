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
python3 shadowcraft/operations/build-client-index.py DECODED_TABLE_DIR ENGLISH_JSON STEAM_BUILD_ID frontend/public/shadowcraft/data/client-index.json
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
