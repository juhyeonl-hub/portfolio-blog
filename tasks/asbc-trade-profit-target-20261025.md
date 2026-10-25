# 거래소 원하는 이익률 및 결과 안내 개선

[Task Goal]: 구매가만으로 계산하는 기본 흐름을 유지하면서 원하는 이익률과 본전 기준을 명확하게 표시하고 선택 목표 입력 오류가 판매 손익을 막지 않게 한다.

- Owner: Codex. Claude 불가로 Codex 임시 조율. 기록된 usage_limit (Oct 26 14:00 Europe/Helsinki 재개 예정), 재시도하지 않음.
- Scope: app/trade-calculator.tsx/css, lib/trade-calculator.ts, tests/trade-calculator.mjs, 관련 UI 번역, 본 작업 기록만. 공개 접근 유지, 인증/동기화/서버 기능 변경 없음.
- Base commit: aacf13e2fe05b4e4bedaa3b47bf00b739214fb89
- Done when: 원하는 이익률을 0~100% 소수 둘째 자리까지 직접 입력, 목표/판매가 즉시 갱신, 손실 없는 최소 가격 표시, 목표 총이익은 선택 입력, PC/모바일 폭 검증 후 관련 변경만 main 푸시/운영 배포 (기존 직접 배포/리뷰 생략 승인).
- Expected: 구매 단가 130000, 100개, 25개씩, 세율10%, 비용0에서 7.5% 목표 순익975000, 최소 판매가155278, 실제 순익975020. 0%는 최소 본전 이상 가격. 수량과 세율 변경 즉시 반영.
- Failure cases: 비율 공백/잘못된 값/100% 초과에서 오래된 목표 판매가 금지; manual 목표 공백/오류는 해당 목표 안내만 제한; 기본 순익은 유지. 세율100% 불가능 목표, 비용0, 정확한 총원가, 예전 저장값 마이그레이션, 모바일 가로 넘침 확인.
- Verification: npm run typecheck:shadowcraft, npm run lint, node tests/trade-calculator.mjs, node tests/localization.mjs PASS. Isolated npm run build:asbc PASS (22.04s; existing chunk-size/plugin-timing warnings only). Calculator tests cover 120 independent listing/tax/min-price oracle cases plus exact custom percentage boundaries, 100% tax, optional target, legacy draft migration.
- Last verified: Local browser PC (Chrome, measured 1152px) and mobile viewport (390px) PASS. 7.5%: sale155278/profit975020; invalid101 clears stale result and preset recovers; blank/invalid optional goal preserves manualprofit500000; reload retains7.5; totalcost13m/q200/tax0 -> sale69875/profit975000/break-even65000. No horizontal overflow. Existing 206 baseline files preserved by SHA256 except intentionally merged translation additions (semantic equality verified).
- Last reviewed: Claude 미실시, 단독 검증을 교차 리뷰로 기록하지 않음.
- Findings: 즉시 재계산은 기존 구현에 있음. 추가 중복 화면 대신 결과 영역에 선택한 이익률과 본전 기준을 표시.
- Uncommitted: 시작 기준 206개 파일 해시를 D:/CodexData/Projects/ASBC/artifacts/trade-profit-target-20261025/baseline.json에 보존.
- Next: 완료. 신규 요청 전 관련 없는 변경 보존.
- Blocker: 없음.

## 운영 반영 결과

- Source commit: dff190d96aa62daee08bc89bbff5112a6a034fa6 (main -> origin/main push 완료).
- Production deployment: https://cbdc82f8.asbc-4c9.pages.dev / https://asbc.app/#/trade
- Canonical verification: HTML 및 9개 JS/CSS 자산이 분리 빌드와 바이트 단위 일치. production-release-check.json에 SHA256 기록.
- Production UI: Chrome 실제 viewport1440 / 모바일 viewport390에서 7.5% -> sale155278/profit975020/break-even144445 일치. 목표 총 순익을 비운 판매가150000 -> 순익500000 유지. 가로 넘침 없음. 물리 모바일 기기 검증은 아님.
- 기존 저장값 profitRate 누락 ->10% 마이그레이션 확인. 검증 뒤 원래 구매단가130000/수량100/묶음25/세율10/등록비0/판매가150000/목표500000 복원. 새 이익률 기본10. 공개 이용 유지.
- Artifact directory: D:/CodexData/Projects/ASBC/artifacts/trade-profit-target-20261025 (production-pc.png, production-mobile.png, browser-evidence.json, production-release-check.json, build.log, deploy.log).
- Final preservation: 시작 시 기존 파일206개 SHA256 및 번역 before+9개 추가키 동등성 PASS. 릴리스에 기존 globals.css/home-panel.tsx 변경과 무관한 번역 변경 미포함. 임시 QA 탭2개와 해당 HTTP 서버 정리, 브라우저 화면 크기 복원.
- Limitation: 실제 게임 세금 소수점 처리·비례 등록비는 확정하지 않음. 화면의 기존 미확인 안내 및 조정 가능 입력 유지.
- Review: 사용자 기존 명시 승인으로 Claude 교차 리뷰 생략. Claude usage_limit 재시도 없음.
