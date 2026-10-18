<!-- shared-agent-workflow-v1 -->
# 공용 작업 절차

기존 프로젝트 규칙·사용자 지시가 우선한다. 이 문서는 특정 제품의 규칙을 포함하지 않는다.

- 시작: 실제 프로젝트 루트, Git 상태, 기존 규칙과 빌드/테스트 명령을 확인한다. 기존 변경은 보존한다.
- 작성자는 폴더당 한 명. 구현/검사는 프로젝트의 기존 도구와 OS에서 실행한다. 없는 npm 명령이나 Unity 명령을 만들지 않는다.
- 여러 세션에 걸치는 작업은 tasks/<ID>.md 한 곳에 Owner, Scope, Done when, Base commit, Verification, Last verified, Last reviewed, Findings, Uncommitted, Next, Blocker를 기록한다. 관련 기존 작업 관리 문서가 있으면 먼저 재사용한다.
- 인계 전 작성과 관련 실행을 멈춘다. 같은 폴더는 미커밋 인계 가능하며 staged/unstaged/untracked와 다음 행동을 기록한다. 수신자는 실제 Git 상태와 diff를 대조한다. 대화 내용은 자동 전달되지 않는다.
- 다른 폴더/PC 인계는 승인된 범위의 커밋·전송을 사용한다. 문서에 자기 자신의 커밋 SHA를 기록하려 반복 커밋하지 않는다. 소스 SHA와 문서만 바꾼 후속 커밋을 구분한다.
- 리뷰는 작업의 위험도에 맞춰 선택한다. 저장/인증/결제/삭제/배포 등 높은 위험은 교차 리뷰한다. 처음부터 불필요한 전수 검사를 반복하지 않는다.
- 공식 리뷰: WSL에서 `node tools/shared-agents/review.mjs <codex|claude> tasks/<ID>.md <base> [lastReviewed]`. 깨끗한 커밋 상태만 받는다. 기존 미커밋 변경을 자동 커밋하지 않는다. Git이 없으면 자동 초기화하지 말고 작업에 필요한지 판단한다.
- 종료 0=완료/지적 없음, 1=지적 처리 필요, 2=실행/입력/형식 실패. 실패를 통과로 기록하지 않는다. 지적은 수정 또는 이유와 함께 수용하고 관련 검사를 한다. Last reviewed는 승인 표시가 아니다.
- Codex read-only 샌드박스, Claude Read/Grep/Glob 제한은 리뷰 실행기에만 적용된다. 일반 작성 채팅은 읽기 전용이 아니다. Claude 도구 제한은 OS 전체 파일 쓰기 금지가 아니다.
- .agents/reviews의 보고서는 Git 제외이므로 인계 파일에 지적을 요약하거나 수신자가 접근 가능한 자료로 전달한다.
- 자동 stage/commit/push/merge/배포 또는 새 예약 실행을 하지 않는다. 프로젝트 설정·보안 정책·기존 규칙을 임의 변경하지 않는다.

CLI: WSL Ubuntu-22.04의 공유 Codex 0.163.0을 기본 리뷰 실행기로 사용한다. Claude는 WSL의 기존 로그인된 CLI를 사용한다. AGENT_CODEX_BIN/AGENT_CLAUDE_BIN으로 절대 WSL 경로 지정 가능. 버전·hooks·MCP·플러그인 변경 시 권한을 재검증한다.
