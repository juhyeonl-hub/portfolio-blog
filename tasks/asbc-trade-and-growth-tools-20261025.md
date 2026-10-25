# 거래·장비·성장 도구 순차 개선

[Task Goal]: 구매 상한과 일부 판매 손익을 먼저 배포하고, 장비 보관 판단·장비 교체 스킬 안내·성장 기록을 확인된 데이터 범위에서 순차 구현·검증·배포한다.

- Owner: Codex. Claude 불가로 Codex 임시 조율 (기록된 usage_limit, Oct26 14:00 Europe/Helsinki; 재시도 없음).
- Scope: 1단계 trade-calculator.ts/tsx/css, 신규 trade-planning.tsx, tests/trade-calculator.mjs, 관련 번역; 2단계 장비 보관/스킬 안내 및 캐릭터 기록 관련 파일은 조사 후 명시. 인증·서버 저장·기존 다른 변경 제외.
- Done when: 5개 기능 각각 계산/보수적인 판단 근거·초보자 UI·PC/모바일 확인, 관련 변경만 main 푸시/운영 배포. 사용자 이번 턴 직접 배포/순차 진행 승인 및 기존 Claude 리뷰 생략 승인 적용.
- Base commit: dd8d7f2d8ccad32dff2a3098a51805e62ea243cc
- Expected stage1: 예상판매150000/100개/25개묶음/세10/비용0/목표10% -> 구매상한 개당122727, 전체구매비상한12272727. 구매130000*100/25개판매/정산수령3375000 -> 팔린이익125000, 재고75개/원가9750000, 남은본전판매가142593.
- Failure cases: 잘못된 숫자·음수·100%세금·이익불가·미판매/전량판매·초과판매·소수원가배분·잘못된 저장값·저장실패·원본 캐릭터 부족/다른캐릭터/비교불가능 스킬정보는 단정금지.
- Verification: 진행 중.
- Last verified: 시작 상태 보존, baseline.json 기록.
- Last reviewed: Claude 미실시; 단독 검증을 교차 리뷰로 기록하지 않음.
- Findings: 일부 판매는 실제 정산 수령액을 입력받아 세금 중복 차감을 방지. 한 번에 산 물량 단위로 계산하며 예상 판매가와 실제 판매기록을 구분.
- Uncommitted: 기존 206개 파일 해시를 D:/CodexData/Projects/ASBC/artifacts/trade-and-growth-tools-20261025/baseline.json에 보존.
- Next: 1단계 구현→검사→분리배포→운영QA, 이후 3~5 조사/구현.
- Blocker: 없음.

## Stage 1 verification
- TypeScript, ESLint, calculator regression/oracle tests, localization: PASS. Isolated production build: PASS including final storage guard.
- PC 1440x1000 and mobile 390x844: maximum purchase 122727 / 12272727; partial sold profit125000, stock9750000, remaining price142593; all-sold500000; oversized sale blocked; delete undo and reload persistence checked. No horizontal overflow on mobile.
- Corrupt saved ledger and conflicting browser-tab writes are preserved rather than overwritten. No unverified game rounding/fees represented as fact.
- Baseline206 unrelated paths preserved; translation deployment rebuilt from HEAD plus only task keys.
