# 공개 빌드·매크로 UX 개선 — 2026-10-22

## 조율과 보존
Claude 불가로 Codex 임시 조율. 이전 실행의 usage_limit 유지, 재개 시각 2026-10-26 14:00 Europe/Helsinki. 재시도하지 않음.
시작 시 tracked diff를 artifacts/public-build-flow-20261022/before.patch에 보관. 앞선 Steam/장비/데바니온/지도 변경과 무관한 파일 보존. 커밋·푸시·배포하지 않음.

## 구현
- 공개 빌드: 제목 링크 중심 게시판, 직업/제목/정렬 검색 유지, 내 게시물만 제거. 게시 양식에 현재 게시할 직업 표시.
- 상세: 별도의 읽기 전용 사이트 프레임으로 PC 사이드바와 모바일 가로 메뉴 유지. 계정 설정 패널 반복 제거, 좋아요/수정/신고는 게시글 안에 통합.
- 공유: 저장된 플래너를 마운트하지 않고 스킬 아이콘·레벨·특화 카드와 실제 좌표의 데바니온 선택 판을 탭으로 표시. 명시적 적용/되돌리기 및 JSON 내보내기 유지. 장비 목록이 공유 데이터에 없다는 설명 유지.
- 권한 표시: 세션이 없고 authorId도 없을 때 undefined === undefined가 되어 수정/삭제 버튼을 보이던 조건 수정. 서버 권한 정책은 변경하지 않음.
- 매크로: 8직업 공통 4칸 세로 슬롯, 맨 아래부터 위로, 숫자 키와 별도 수동 키. 수호성은 검증된 반복 배치가 없어 임의 배치를 만들지 않음. 살성 기습 포함 선택과 기존 체크리스트 저장 키 보존.
- 스킬 목적: 로컬 공식 영문 클라이언트 설명(skill-descriptions.json)을 근거로 개별 사용 상황 74종 작성; ko/en/ja/fi 제공. 수치가 해석되지 않는 항목의 수치를 추측하지 않음. 키 배치는 예시임을 명시.
- 포인트: 현재 ShadowcraftController.profile이 pointsAvailable=false를 반환하며 총 보유량을 전달하지 않음. 실제 조회 배치와 플래너의 추정/저장된 총량을 구분하고 사용량+잔여량 입력 안내. 실제 총량을 임의로 계산하거나 기존 예산을 덮어쓰지 않음.
- 비공식 외부 이동: gaming.tools/game8/A2Tools/GitHub 등 이동 링크 제거, 필요한 출처명은 텍스트 보존. 동적 출처/공지 링크는 HTTPS plaync.com/ncsoft.com/steampowered.com/steamcommunity.com 및 하위 도메인만 허용. 내부 링크, ASBC 이전, JSON 다운로드, 문의 메일 보존. 데이터 수집·라이선스·원천 파일 수정 없음.

## 검증
- npm run typecheck:shadowcraft PASS
- npm run lint PASS
- npm run test:shadowcraft 전체 32 suite PASS (unit.log)
- node tests/official-url.mjs PASS: 공식 호스트 및 유사 도메인/프로토콜/사용자정보/포트 거부, 모든 수동 스킬 설명 및 번역 확인
- node tests/localization.mjs 최종 PASS: 전체 41 화면, 매개변수와 번역 키 확인
- public_build_flow.py 최종 PASS: 1920/390/320px, 메뉴 높이/가로 넘침, 게시판/미리보기 탭, 저장 불변, 명시적 적용/되돌리기, 8직업 매크로, 렌더된 외부 링크 점검, 비로그인/작성자/타회원 좋아요/수정(로컬 fixture만)
- build_share.py PASS: URL/JSON 공유, 읽기 전용, 잘못된 주소/참조/버전 차이, 직업 전환, 모바일
- public_builds.py PASS: 검색/필터/재시도/404/안전한 텍스트, 관리자 초안/공개/충돌/삭제(로컬 fixture만)
- VITE_ASBC_NEW_ORIGIN=https://asbc.app npm run build:asbc 최종 PASS. 기존 대형 번들 chunk 경고가 있으나 빌드 성공.
- git diff --check PASS
- PC/모바일 스크린샷 직접 확인. 모바일 메뉴가 긴 세로 목록으로 표시되는 점을 발견해 가로 줄바꿈으로 수정하고 높이 회귀 검사 추가.

## 한계와 인계
공개 캐릭터 조회의 총 포인트 연동은 여전히 제공되지 않음. 실제 게임의 보유량은 사용자가 확인해야 함. 이번 검증은 로컬 앱/fixtures이며 운영 환경에 변경을 배포하지 않음.
Claude 교차 리뷰 미실시. 앞선 인증 변경과 이번 게시물 권한 표시 변경을 포함한 릴리스 전 교차 리뷰 대기. 자체 검증을 교차 리뷰 통과로 기록하지 않음.
