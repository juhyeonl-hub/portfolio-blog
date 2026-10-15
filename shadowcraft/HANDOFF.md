# Shadowcraft — Codex 인수인계 및 블로그 이식

작성일: 2026-10-15. 이 문서와 같은 폴더의 `source/`를 함께 전달하세요.

## 1. 다음 Codex에게 주는 작업 지시

> 이 패키지의 HANDOFF.md를 먼저 읽고 source/를 현재 구현의 기준으로 사용해 주세요. 기존 블로그 저장소의 AGENTS.md, 프레임워크, 배포 구조를 확인한 뒤 Shadowcraft 아이온2 글로벌 PvE 플래너를 블로그에서 이용할 수 있도록 통합해 주세요. 캐릭터 조회, 8직업 포인트 추천, 장비 보너스, 브라우저 OCR, 저장·복원을 보존해야 합니다. 기존 블로그 구조에 맞는 경로 또는 별도 서브도메인을 선택하고 이유를 설명해 주세요. 먼저 실행 가능한 이식 결과를 만들고 검증하세요. 공개 배포는 요청된 대상과 기존 권한 정책에 맞춰 진행하고, 원래 비공개 Sites를 임의로 공개하거나 덮어쓰지 마세요. 서버 인증·관리자 갱신 API 보호 없이 인터넷에 공개하지 마세요. 아래 ‘이식 시 필수 작업’과 ‘수용 기준’을 완료하고 실제 검증 결과와 미완료 항목을 구분해서 보고해 주세요.

## 2. 현재 결과물과 기준 버전

- 제품: **Shadowcraft**, 아이온2 **Steam 글로벌 서버 기준**, 한국어 PvE 플래너.
- 현재 URL: https://shadowcraft-assassin.aglow-flame-2488.chatgpt.site
- Sites 프로젝트: `appgprj_6ad03184c1908191935ab7539ddba200`
- 현재 접근 범위: 소유자 전용 비공개. 링크만 블로그에 붙이면 일반 독자가 이용할 수 있는 상태가 아님.
- 소스 기준 커밋: `8ec574b258d3c689a3d1f0ead7e8b6f3fdad17a9`
- 성공한 배포 ID: `appgdep_6ad0d8b2fa2c8191ae13c661bdd6fb5c`
- 버전 ID: `appgprj_6ad03184c1908191935ab7539ddba200~appgver_d8de1d541b0c81919c2ad9e26094e676`
- 배포 완료 시각: 2026-10-15 13:44:42 UTC / 16:44:42 핀란드.
- 원래 개발 경로: `/workspace/sites/shadowcraft-assassin`. 다음 환경에서는 패키지를 푼 경로를 사용.
- 별도 문서 변경·포장은 했지만 원래 서비스 소스와 배포는 이번 인수인계 작업으로 바꾸지 않음.

## 3. 패키지 구성

| 경로 | 내용 |
|---|---|
| `HANDOFF.md` | 이 문서. 제품 의도, 구현, 운영, 이식 계획, 제한사항 |
| `source/` | 기준 커밋의 추적된 소스 전체. 앱, API, 스키마, 테스트, 빌드 설정, 의존성 잠금 파일 포함 |
| `source/public/game/` | 로컬 게임 스킬·직업·보드 아이콘 |
| `source/public/ocr/` | Tesseract worker/core 및 한국어·영어 언어 데이터, 라이선스 |
| `runtime-data/*.json` | 현재 서비스 `/api/catalog?class=...`에서 읽은 직업별 데이터·최근 기록·공지 응답 |
| `runtime-data/export-status.json` | 실제 수집 시각과 각 직업의 성공/실패, 버전, origin, 검토 상태 |
| `operations/catalog-seed.sql` | 성공적으로 수집한 글로벌 카탈로그와 공지만 새 DB에 넣는 SQL. 개인 계획은 없음 |
| `operations/sync_current_site.py` | 현재 비공개 Sites용 공개 원본 수집·인증 동기화 보조 스크립트. 새 서버에서는 인증 방식 수정 필요 |
| `fixtures/gear-tooltip-preprocessed.png` | 기존 사용자 장비 이미지에서 만든 OCR 테스트용 전처리 이미지 |
| `FILE_MANIFEST.json` | 파일 경로·바이트 크기·SHA-256. 자신은 제외 |
| `VERIFY_BUNDLE.py` | 외부 라이브러리 없이 파일 무결성을 확인하는 도구 |

제외: `.git`, `node_modules`, 빌드 산출물, 캐시, 로컬 D1 파일, 토큰·쿠키·환경변수, `tsconfig.tsbuildinfo`. 의존성은 잠금 파일로 재설치합니다. `README.md`는 남아 있는 스타터 문서이므로 프로젝트 현황은 **이 문서와 실제 코드**가 우선입니다. 특히 스타터의 npm 설치 설명 대신 현재 `pnpm-lock.yaml`을 사용하세요.

**개인 입력 데이터는 소스 파일이 아닙니다.** 실제 브라우저에 입력한 캐릭터·장비·포인트와 서버 `user_plans` 전체는 이 패키지에 포함되지 않습니다. 기존 페이지의 ‘빌드 내보내기’로 사용하는 직업마다 JSON을 내려받아 새 페이지에서 가져와야 합니다. 최근 캐릭터 기록, 장비, 검색 조건도 Plan에 들어 있어 함께 이동합니다. 원본과 새 도메인의 localStorage는 자동 공유되지 않습니다.

## 4. 사용자의 핵심 의도

1. 스팀 글로벌 기준으로 한국어 스킬·특화·데바니온 배분을 보기 쉽게 제공.
2. 보유 **총** 스킬/스티그마/데바니온 포인트를 직접 입력하고 그 예산 안에서 추천.
3. 살성 이동기가 반복 매크로에 섞여 보스 장판으로 이동하는 문제 방지. 이동·생존기는 수동 분리 유지.
4. 장비 보너스까지 포함한 최종 스킬 레벨과 특화 해금 반영. 중요 사례: **심장 찌르기 기본 투자+장비 보너스 = 16**에서 치명타 적중 시 초기화 특화 고려.
5. 장비 현황과 목표 장비를 비교하고, 스크린샷 붙여넣기 OCR로 입력 부담을 줄임.
6. 입력한 캐릭터·장비·포인트를 재방문 후 복원.
7. 다른 직업도 이용 가능. 블로그 독자에게 공개할 수 있게 별도 Codex로 통합 예정.

게임 클라이언트 조작, 자동 클릭, 메모리/패킷 접근, 실시간 게임 오버레이는 구현하지 않았습니다. 이 페이지의 변경은 게임 안의 배분을 바꾸지 않습니다.

## 5. 구현 완료 범위

### 직업과 추천

| 내부 classKey | 직업 |
|---|---|
| `assassin` | 살성 |
| `gladiator` | 검성 |
| `templar` | 수호성 |
| `ranger` | 궁성 |
| `elementalist` | 정령성 — 원본 gaming.tools 경로는 `spiritmaster` |
| `sorcerer` | 마도성 |
| `cleric` | 치유성 |
| `chanter` | 호법성 |

- 직업별 카탈로그, 핵심기·스티그마·운영 가이드, 포인트 예산 추천.
- 스킬·스티그마·데바니온/PvP 결정 예산과 연결된 보드 경로 비용 계산.
- 특화 선택 칸과 요구 레벨을 확인. 예산 추천은 휴리스틱이며 최고 DPS를 증명하는 최적화기가 아님.
- 글로벌 원본: https://aion2.gaming.tools/ko/builds/assassin/pve
- `reviewRequired`를 통해 새 데이터 반영과 추천 검토 완료를 구분. 패치 수집만으로 추천 검증 완료라고 표시하면 안 됨.

### 장비와 특화

- 직접 입력 / 현재 장비 합산 / 목표 장비 가정 모드. 모드를 섞어 장비 보너스를 이중 합산하지 않음.
- 장비명, 부위, 소유 여부, 현재/목표 선택, 복수 스킬 보너스, 메모. 현재 UI 최대 80개.
- 부위별 현재 장비에 목표 장비를 교체하는 비교. 일반 공격력·치명타 등 전체 전투 스탯이나 가격/파밍 최적화는 미구현.
- 유효 레벨 변경 및 모드 변경 시 `updatePlan()`이 해당 특화를 다시 계산. 사용자가 특화를 명시적으로 지정한 patch는 존중.
- 살성 심장 찌르기 `13350000`: 레벨 16 이상에서 초기화 `13350050`, 다단히트 `13350040`을 우선 고려. 안정/공격 모드와 실제 슬롯 수로 나머지 선택을 결정.
- 원래 보고된 버그: 레벨 16이 되어도 기존 특화가 재계산되지 않음. 장비·레벨 변경 경로의 재계산을 보강하고 테스트함.

### 캐릭터 검색

- EU, 북미 동부/서부, 남미, 아시아 지역 및 서버 선택. 저장된 서버 목록 + 최신 목록 조회.
- 캐릭터 공개 프로필, 최종 스킬 레벨, 장착 스킬, 데바니온 개방 노드 조회.
- 잔여 포인트, 기본 투자와 장비 보너스의 분리, 인벤토리 전체 자동 입력은 제공하지 않음.
- `POST /api/armory` → 검증된 파라미터로 내부 `GET /api/character` 구현 사용.
- 최신 검색 API의 실제 응답은 외부 서비스에 의존. API 변경·차단 시 오류 표시와 저장된 계획 보존 필요.

### OCR

- `내 장비 & 성장`에서 Ctrl+V, 붙여넣기 버튼, 파일 선택, 드래그앤드롭.
- Tesseract.js 7.0.0, 한국어+영어 모델. 이미지 처리는 브라우저 내부에서 수행; 이미지 서버 업로드/보관 없음.
- 10MB/25MP 제한, 전처리/반전, 영역 선택, 취소, 90초 인식 제한.
- 장비명/부위 추정 및 **스킬명 + 레벨 보너스**를 입력 후보로 추출. 애매한 결과 표시, 수정·확인 체크 후 등록.
- OCR 숫자 오류 때문에 인식 결과를 검토 없이 추천에 적용하지 않음. 새 장비는 현재/목표 자동 선택하지 않음.
- 일반 스탯·강화 단계·전체 장비 성능의 자동 해석은 미구현.
- 실제 이미지에서 문양 폭발 `13130000` +1 추출을 확인. 전체 이미지에서는 장비명이 틀릴 수 있어 영역 선택/수정 필요.

### 저장·복원

- 키: 살성 `shadowcraft-plan-v1`, 나머지 `shadowcraft-plan-v1:<classKey>`.
- 마지막 직업: `shadowcraft-selected-class`.
- `Plan`에 character, gear, pointBudget, base/bonus/specs/nodes, checked, searchPrefs, recentCharacters, macroExtra 등 포함.
- **직업별 계획 1개**. 최근 캐릭터 최대 8개는 재조회 목록이며, 캐릭터별 독립 빌드 저장 슬롯이 아님.
- 브라우저 저장을 먼저 복원; 입력 시 즉시 기록. 네트워크 실패 또는 늦은 서버 응답이 로컬 저장이나 새 편집을 덮어쓰지 않음.
- 로컬 데이터가 없고 편집도 없을 때만 계정 저장 응답을 복원.
- 계정 저장은 900ms 지연 PUT, 요청 제한 8초, online 이벤트 시 재시도. 실제 성공 여부에 따라 상태 표시.
- **충돌 병합/최신 타임스탬프 비교 방식이 아님. 로컬 계획 우선**이므로 다른 기기 최신 데이터가 자동 병합된다고 설명하면 안 됨.
- 계정 API는 Sites가 주입하는 사용자 ID를 요구. 과거 환경에서 401이 관찰되어 기기 간 자동 동기화는 보장하지 않음.
- 현재 localStorage 키는 계정별 분리되지 않음. 공용 브라우저의 계정 전환·공개 서비스 이식 시 반드시 정책을 정해야 함.
- 브라우저 데이터 삭제/시크릿 모드/저장 차단 시 보존 보장 없음. JSON 내보내기/가져오기 제공.

## 6. 주요 코드 지도

| 파일 | 책임 |
|---|---|
| `app/page.tsx` | 전체 UI, 직업 전환, 캐릭터 조회, 스킬·보드·운영 탭 |
| `app/point-budget.tsx` | 총 포인트 입력, 추천 적용 |
| `app/gear-panel.tsx` | 장비 관리, 현재/목표 비교 |
| `app/gear-ocr.tsx` | 붙여넣기·파일·crop·OCR worker와 검토 UI |
| `app/use-plan-memory.ts` | React 상태와 로컬 저장/계정 동기화 |
| `lib/plan-memory.ts` | 복원, 지연 응답 보호, 즉시 저장, 최근 캐릭터 중복 제거 |
| `lib/planner.ts` | Plan 타입, 비용·최종 레벨·특화·보드 경로 |
| `lib/recommendation.ts` | 예산별 추천 배분 |
| `lib/classes.ts`, `lib/data/class-profiles.json` | 8직업 프로필과 우선순위 |
| `lib/catalog-loaders.ts`, `lib/data/catalogs/*.json` | 번들 카탈로그와 직업별 동적 로딩 |
| `lib/gear-ocr.ts` | OCR 텍스트에서 알려진 스킬·레벨 추출 |
| `lib/catalog-server.ts`, `lib/literal-parser.mjs` | D1 카탈로그, HTML 데이터 파싱, 변경 감지, 공식 공지 |
| `lib/armory-client.ts`, `app/api/character/route.ts` | 캐릭터 API 요청·검증·변환 |
| `app/api/plan/route.ts` | 사용자 ID에 귀속되는 Plan 읽기/쓰기 |
| `db/schema.ts`, `drizzle/*.sql` | D1 테이블 정의와 초기 마이그레이션 |
| `vite.config.ts`, `build/`, `scripts/` | Vinext + Cloudflare + Sites 실행/빌드 |

## 7. 실행과 검증

기존 프로젝트는 **Next.js 스타일 App Router를 사용하는 Vinext + React + TypeScript + Cloudflare Workers/D1** 앱입니다. 단일 HTML이나 그대로 실행 가능한 표준 Next.js/Vercel 프로젝트라고 가정하지 마세요.

- 실제 작업 환경 Node 24. package.json 최소 Node 22.13.0.
- packageManager: `pnpm@11.25.0`; 의존성은 `pnpm-lock.yaml` 기준.
- `pnpm-workspace.yaml`의 의존성 빌드 허용 정책 보존. Tesseract 설치 후원 메시지 postinstall은 실행하지 않도록 false 지정.
- 외부 Codex/Windows에서는 압축을 풀고 `source`로 이동. 빈 체크아웃은 자동으로 portable 실행 모드 사용.
- 아래는 소스에 정의된 standalone 실행 경로. **사용자의 Windows 및 블로그 호스팅에서 새로 실행한 검증 결과는 아님**.

```sh
cd source
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit --incremental false
node tests/plan-memory.mjs
node tests/gear.mjs
node tests/gear-ocr.mjs
node tests/armory.mjs
node tests/budget.mjs
node tests/classes.mjs
pnpm run build
```

로컬 DB는 빌드 후 **새 로컬 DB에 한 번** 초기화합니다. 기존 테이블에 초기 CREATE를 다시 실행하지 마세요.

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_gorgeous_anthem.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file ../operations/catalog-seed.sql
pnpm run dev
```

기본 개발 포트 5173. 빌드된 Worker 확인은 `pnpm start`. 기존 Sites 프로젝트로 배포할 때는 해당 환경의 Sites skill 절차를 사용하세요. 이 패키지의 `.openai/hosting.json`에는 **원래 프로젝트 ID**가 있으므로 새 블로그의 배포 대상으로 그대로 사용하면 안 됩니다.

선택적 실제 OCR 테스트:

```sh
node tests/gear-ocr-image.mjs ../fixtures/gear-tooltip-preprocessed.png
```

패키지 무결성 확인은 루트에서 `python VERIFY_BUNDLE.py`.

### 지금까지 검증한 범위

- 저장 수정 후 TypeScript 검사, `tests/plan-memory.mjs`, 8직업 장비/추천 예산 테스트, 운영 빌드 통과.
- 저장 테스트: 기존 데이터 복원, 늦은 계정 응답 차단, 즉시 저장, 계정 fallback, 저장 차단·손상 데이터, 직업 분리, 최근 목록 중복/개수.
- 장비 테스트: 수동/합산 분리, 목표 부위 교체, 추천 예산, 심장 찌르기 15↔16 특화 변화.
- OCR 텍스트 파서 테스트 및 위 실제 이미지의 문양 폭발 +1 추출 확인.
- 배포는 성공 상태 응답으로 확인.
- 마지막 저장 변경 이후 실제 브라우저 클릭·새로고침·붙여넣기 E2E는 미수행. 당시 환경의 브라우저 검증 도구가 제공되지 않았음. 이식 후 반드시 실행.

## 8. 서버 API 및 데이터

| API | 동작 | 이식 시 주의 |
|---|---|---|
| `GET /api/catalog?class=...` | 카탈로그·최근 12개 업데이트 기록·공지 | D1 실패 시 현재 503; 프론트 번들 데이터 유지 |
| `POST /api/sync?class=...` | 원본 HTML로 글로벌 카탈로그 갱신 | 관리자 전용으로 보호해야 함 |
| `POST /api/refresh?class=...` | 공식 글로벌 공지 확인 | 호출 제한/관리 권한 정책 필요 |
| `POST /api/armory` | 서버·캐릭터 검색/프로필 | 외부 API 제한·응답 변경 대응 |
| `GET /api/character` | 공개 조회 구현 | 공개 전투정보실 프록시; 입력 검증 유지 |
| `GET /api/plan?class=...` | 현재 사용자 계획 읽기 | 검증된 로그인 세션 필요 |
| `PUT /api/plan` | 현재 사용자 계획 저장 | 사용자 분리, 본문 제한 150000 유지·검증 강화 |

D1 `DB` 테이블:

- `catalog_snapshots(id,payload,checked_at,hash)`: `global-<classKey>` 및 `official-news`.
- `update_events(id,checked_at,status,message)`: 갱신 기록. 현재 API에서 최근 12개만 조회됨.
- `user_plans(user_id,payload,updated_at)`: 살성 키는 사용자 ID, 나머지 `userId:classKey`.

`runtime-data/`는 카탈로그 API 응답의 읽기 전용 스냅샷입니다. 전체 DB 백업이나 전체 이벤트 이력은 아닙니다. seed SQL은 카탈로그와 공지만 upsert하며 `user_plans`와 이벤트 테이블을 건드리지 않습니다. 기존 운영 DB에 무심코 실행하면 카탈로그가 스냅샷 시점으로 되돌아갈 수 있으므로 새 개발/이식 DB에만 사용하세요.

## 9. 게임 데이터 업데이트 운영

현재는 외부 실행 환경이 일반 공개 페이지를 Python urllib로 조회한 뒤 기존 비공개 Sites API에 전달합니다. 배포 Worker에서 원본 직접 조회는 차단된 적이 있어 이 경로를 선택했습니다.

1. 연결된 Site의 get_site에서 실제 URL과 지원되는 `siwc_bypass_bearer_token`을 취득. 토큰은 메모리에서만 사용.
2. `https://aion2.gaming.tools/ko/builds/assassin/pve` GET. HTTP 200, 최대 3,000,000바이트. 접근 차단/CAPTCHA 발생 시 중단·이전 데이터 유지. 우회 금지.
3. HTML 원본을 `/api/sync`에 `Content-Type: text/html`, `OAI-Sites-Authorization: Bearer <token>`으로 POST.
4. 같은 인증으로 `/api/refresh` POST, `/api/catalog` GET.
5. origin=live, checkedAt, version, history 확인. 변경 없는 정상 완료는 알림 생략.
6. D1만 갱신. 사용자 계획·포인트·이동기 설정·reviewRequired를 임의 변경하지 않음.

- 현재 연결된 정기 작업은 **살성** 중심입니다. 앱/API가 8직업을 지원한다고 해서 8직업 모두 매시간 갱신된다고 설명하지 마세요.
- 기존 작업 ID: `Automation_4d51a167b39081919bd25655b121c917` (이전 운영 기록 기준). 이식 후 현재 상태를 조회해서 대상 변경 또는 종료 여부를 결정; 이번 작업에서는 수정하지 않음.
- 화면이 열려 있을 때 별도로 15분마다 공지 확인; 서버 공지 조회는 5분 캐시.
- 원본 스키마 검증은 현재 직업당 스킬 35개·보드 5개 및 노드/스킬 형식을 검사. 게임이 구조를 바꾸면 자동 반영을 멈추므로 새 스키마와 테스트를 먼저 검토.
- 데이터 변경은 `reviewRequired=true`를 유지하도록 누적. 패치 수집이 곧 추천 자동 검증은 아님.
- 새 블로그에는 기존 ChatGPT 정기 실행이 자동 이전되지 않음. 새 관리자 인증과 스케줄러를 설정해야 함.
- 동봉된 `sync_current_site.py`는 위 절차를 수동 실행하기 위한 보조 코드로, 이 문서 작성 중 실제 쓰기 호출은 실행하지 않았음.

## 10. 블로그 이식 시 필수 작업

### 배치와 경로

- 먼저 실제 블로그 저장소·호스팅을 확인. 이 패키지에서는 블로그 기술 스택을 조사하거나 변경하지 않았음.
- 별도 앱을 서브도메인에 두고 블로그에 소개/링크를 넣으면 기존 API·루트 경로 보존이 쉬움. 블로그 내부 경로에 통합해도 되지만 아래 경로를 모두 수정해야 함.
- 현재 `/api/...`, `/game/...`, `/ocr/...`가 루트 절대 경로. `/tools/aion2` 같은 하위 경로에 넣으면 API, 아이콘, OCR worker/core/lang 경로와 번들 base 설정을 함께 조정.
- iframe은 사이트 인증·프레임 정책·클립보드 권한·모바일 높이까지 별도 검증 필요. 단순 HTML 붙여넣기 형태로는 서버 기능이 이동하지 않음.

### 인증·공개 서비스

- 현재 `/api/sync`는 **소유자 전용 외곽 Sites 접근 제어**를 전제로 함. Origin 검사만으로 관리자 인증이 되지 않음. 공개 배포 전에 관리자 세션 또는 서버 전용 갱신 비밀키 인증을 구현.
- 새 서버에서 클라이언트가 보낸 `oai-authenticated-user-id`를 신뢰하면 안 됨. 서버가 검증한 세션에서 사용자 ID를 얻고 외부 주입 헤더는 제거/무시.
- 익명 브라우저 로컬 저장으로 공개할지, 블로그 로그인과 계정 동기화를 통합할지 결정. 후자라면 사용자별 localStorage 키, 로그아웃/계정 변경 처리, DB 소유권, 수정 충돌 정책 구현.
- 현재 서버 Plan 검증은 기본 형식 중심. 외부 공개 전 스키마 검증, 요청 크기/빈도 제한, 에러 응답, 로그의 개인정보 최소화 보강.
- 관리 API의 비밀키를 프론트 번들/공개 환경변수/Markdown에 넣지 않음.

### 데이터·저장·라이선스

- Cloudflare 유지 시 독립 Workers/D1 binding 설정. 다른 서버라면 `cloudflare:workers`와 D1 SQL 실행부를 해당 DB 드라이버로 교체.
- 기존 개인 데이터는 직업별 JSON export/import로 이동. 사이트 도메인 변경 시 자동 이전된다고 표시하지 않음.
- OCR worker/WASM/gzip 언어 파일이 올바른 MIME/압축 헤더로 전달되는지 확인. CSP, HTTPS, 클립보드 권한도 점검.
- Tesseract와 vendored 코드의 LICENSE/NOTICE 유지. 게임 아이콘/데이터는 NCSOFT 및 출처 사이트 자산이며 이 소스 제공이 재배포 권리의 증명이 아님. 공개 배포 범위에 맞게 출처·이용 조건 확인.
- 현재 게임 데이터 버전과 추천 기준 버전을 표시하고 검토 대기 상태를 보존.

## 11. 이식 후 수용 기준

- [ ] 8직업 전환 시 각각의 데이터와 기존 저장 내용 복원.
- [ ] 캐릭터 지역·서버 선택/검색/프로필, 실패 메시지, 최근 8개 재선택.
- [ ] 총 포인트 입력 후 추천이 예산을 넘지 않음.
- [ ] 기본 투자와 장비 보너스가 중복 합산되지 않음.
- [ ] 심장 찌르기 15→16에서 초기화 특화 고려, 다시 15로 낮추면 잠긴 특화 제거.
- [ ] 장비 OCR Ctrl+V/파일/드롭, 취소, crop, 불확실 결과 수정 후 저장.
- [ ] 이미지가 서버에 전송되지 않음을 네트워크 패널로 확인.
- [ ] 새로고침/탭 종료 후 캐릭터·장비·포인트·특화·체크 복원.
- [ ] 초기 API 실패/지연 시 저장된 계획 및 새 입력 보존.
- [ ] 브라우저 저장 차단 시 UI가 멈추지 않고 실제 실패 상태 표시.
- [ ] 도메인 간 export/import로 장비·검색 조건·포인트 이동.
- [ ] 최근 캐릭터 목록과 독립 캐릭터별 계획 기능을 혼동시키지 않음.
- [ ] 공개 방문자가 갱신 API를 호출하거나 다른 사용자 계획을 읽거나 덮어쓸 수 없음.
- [ ] 원본 차단·잘못된 스키마·공지 오류 시 이전 데이터 유지 및 검토 상태 보존.
- [ ] 모바일/블로그 하위 경로/독립 창에서 아이콘·OCR 파일·API 경로 정상.

## 12. 남은 제품 작업

우선순위: (1) 블로그 스택에 맞는 실행/인증/공개 경로 완성, (2) 실제 브라우저 E2E, (3) 계정별 저장·동기화 정책, (4) 필요 시 캐릭터별 독립 빌드 슬롯, (5) 다른 직업까지 갱신 작업 확대, (6) 실제 패치별 추천 검토.

미구현 기능을 이미 제공한다고 설명하지 마세요: 자동 인벤토리 수집, 전체 장비 스탯 기반 DPS 최적화, 가격·파밍 경로 추천, 게임 내 자동 배분, 자동으로 검증되는 최신 메타, 모든 기기 간 충돌 없는 동기화.

## 13. 이번 전달 시점 데이터 확인

카탈로그 API에서 8직업 모두 읽기에 성공했습니다. 버전은 모두 `2.0.7.0`입니다. 살성은 `origin=live`, 나머지 7직업은 `origin=bundled`였습니다. 이 사실은 원본 게임 페이지를 새로 동기화했다는 의미가 아닙니다. 정확한 확인 시각·검토 상태는 `runtime-data/export-status.json`을 보세요. 개인 계획은 조회하지 않았습니다.
