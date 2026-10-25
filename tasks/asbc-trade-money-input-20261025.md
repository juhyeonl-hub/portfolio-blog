# ASBC 거래소 금액 입력 개선

- Owner: Codex. Claude 불가로 Codex 임시 조율. 기존 usage_limit 기록, Oct 26 14:00 Europe/Helsinki까지 재시도하지 않음.
- Scope: 거래소 계산기의 한국어 금액 입력, 개당/전체 구매 비용 구분, 정확한 총원가 계산과 관련 UI/테스트/번역만.
- Done when: PC 및 모바일 폭에서 검증, 관련 변경만 main 반영 및 배포. 기존 직접 배포/리뷰 생략 사용자 승인 적용.
- Base commit: f6749c0
- Verification: typecheck:shadowcraft, lint, trade-calculator.mjs(기존 120 oracle + 한국어 입력/변환/총원가/최소판매가 경계), localization.mjs, 분리 build:asbc 통과. Chrome PC 실제 1152px / IAB 모바일 390px에서 13만 5천 입력, 전체 비용 전환, 총 100키나/3개/50키나 판매 = 35키나 순익, 잘못된 입력, 새로고침 보관 확인. 실물 휴대전화 검증은 아님.
- Last verified: 2026-10-25 운영 https://asbc.app/#/trade 에서 Chrome 1440px, IAB 390px 재검증 완료. 1300만/100개/15만 판매 시 25/50/100개 묶음 모두 총이익 500,000키나 확인. 새로고침 후 이전 저장값 유지와 가로 넘침 없음 확인.
- Last reviewed: Claude 미실시. 단독 검증을 교차 리뷰로 기록하지 않음.
- Findings: 전체 비용을 수량으로 나눈 반올림 값으로 이익을 계산하지 않음. 소수 단가의 묶음별 이익은 확정하지 않고 세후 수령액 표시.
- Uncommitted: 시작 기준 206개 파일 해시를 D:/CodexData/Projects/ASBC/artifacts/trade-money-input-20261025/baseline.json에 보존.
- Release: source 7b803cfbf7739873729b9f0929aa1e8f2da904ae, Pages https://2ee4a9db.asbc-4c9.pages.dev. canonical HTML 및 entry/calculator 자산 9개가 분리 빌드와 바이트 일치.
- Evidence: D:/CodexData/Projects/ASBC/artifacts/trade-money-input-20261025 (build-final.log, deploy.log, production-release-check.json, browser-evidence.json, production-desktop.png, production-mobile.png).
- Preservation: 기존 206개 파일 중 비번역 파일 SHA-256 일치. 번역은 시작 사본에 이번 15개 키만 추가한 값과 일치. 기존 globals.css, home-panel.tsx, 번역 삭제/순서 변경, 미추적 파일 그대로 유지.
- Cleanup: 검증 입력 원복, 임시 Chrome/로컬 탭 및 전용 HTTP 서버 종료. 운영 계산기 IAB 탭 유지.
- Next: 완료.
- Blocker: 없음.
