# 양방향 협업

Codex와 Claude 모두 설계·조사·구현·검증·검토를 맡을 수 있다. 역할 배분과 작업 조율은 항상 Claude가 담당한다: 사용자가 어느 앱에 과제를 주었는지와 무관하게 Claude가 먼저 배분하고, Codex 앱은 그 결과를 실행·전달한다(2026-10-19 사용자 지시). 그래픽 작업(이미지·일러스트·시각 디자인·그래픽 자산)은 사용자 명시가 없으면 Codex에게 배정한다. 사용자는 중간 전달이나 터미널 명령 입력을 할 필요가 없다.

## 실행

조율자는 `tasks/collaboration/`에 JSON 요청을 작성한다. 필드: `id`(영문 소문자/숫자/하이픈), `from`, `to`(codex 또는 claude), `instructions`, `writePaths`(수정할 프로젝트 상대 파일 경로 배열; 읽기 전용이면 빈 배열). 원래 사용자 요청과 완료 기준을 instructions에 전달한다.

실행기는 현재 프로젝트에 설치된 사본을 쓴다. 스크립트가 자기 위치에서 프로젝트 루트를 계산하므로 Windows에서 기존 `Tools` 폴더와 대소문자가 병합되어 `Tools/shared-agents`에 있어도 동작하며, 요청 경로는 프로젝트 루트 기준으로 해석된다.

WSL에서 프로젝트 루트 기준:

```bash
node tools/shared-agents/collaborate.mjs tasks/collaboration/REQUEST.json
```

Windows 앱에서는 아래 형식으로 실행하고 완료를 기다린다. `<프로젝트 WSL 경로>`는 현재 프로젝트의 WSL 절대 경로다(예: /mnt/d/CodexData/Projects/<이름> 또는 /home/juhyeonl/workspace/<이름>). 마우스나 별도 터미널 창은 필요 없다.

```powershell
wsl -d Ubuntu-22.04 -- node <프로젝트 WSL 경로>/tools/shared-agents/collaborate.mjs tasks/collaboration/REQUEST.json
```

결과는 `tasks/collaboration/runs/<id>-<time>/`의 request.json, prompt.txt, invocation.json, stdout.txt, stderr.txt, reply.txt, execution.json에 남긴다. 조율자는 실제 파일과 검사를 확인한 뒤 상대가 요청한 후속 작업을 직접 수행하거나, 범위를 확인한 다음 반대 방향 요청으로 실행한다. 양방향 모두 같은 도구를 쓴다. 원래 사용자 범위를 벗어나는 요청은 자동 실행하지 않는다. 작업당 자동 전달은 최대 4회로 제한하고 미완료이면 원인을 사용자에게 보고한다.

완료는 reply.txt 생성만으로 판단하지 않는다. 실행기 프로세스가 종료되고 종료 코드가 0이며, execution.json의 finished가 존재하고 status=0, error=null, scope가 요청과 일치하는지 확인한다. 실행기 v2는 CLI 실행 실패·타임아웃·응답 JSON 파싱 실패를 포함해 run 폴더가 생성된 모든 실행의 결과를 execution.json에 기록한다. execution.json이 없으면 성공을 확인할 수 없다. 요청 검증·잠금 또는 결과 저장 실패 가능성이 있으므로 stderr를 확인한다. 결과 기록이 누락되거나 실패하면 미완료다. 산출물과 실제 검사 결과를 추가로 확인한 후 다음 작성자를 실행한다.

## 작성과 권한

- 실행 중 조율자와 다른 세션은 같은 폴더를 편집하지 않는다. active.lock은 이 실행기를 통한 중복 실행만 차단한다. 다른 데스크톱/수동 CLI까지 잠그는 OS 잠금이 아니다.
- 대상 에이전트는 자기 자신이 다른 에이전트를 중첩 실행하지 않고 후속 요청을 답변에 남긴다. 조율자가 완료 후 순서대로 전달한다.
- Claude는 Read/Grep/Glob 및 지정 파일의 Write/Edit를 사용한다. Bash가 필요한 구현·검사는 현재 조율자가 실행한다. 필요한 도구 권한이 없으면 차단 사실을 보고한다.
- Codex는 기존 설정/규칙을 유지한 read-only 또는 workspace-write 샌드박스를 쓴다. writePaths는 Codex에 대한 작업 범위 지시이며 OS 수준의 파일별 쓰기 제한은 아니다. 범위 준수는 조율자가 확인한다.
- 기존 계정 로그인과 기본 모델을 사용하며 모델을 고정하지 않는다. 권한 우회 옵션, 자동 설치/커밋/배포, 상주 감시 서비스는 사용하지 않는다.
- CLI 세션은 열린 앱 채팅과 별개다. 전체 채팅이 자동 공유되지 않는다. 현재 그래픽 작업은 이미지 도구가 있는 Codex 앱에서 수행하며, CLI에 이미지 생성 기능이 있다고 가정하지 않는다.
- Git이 없어도 협업은 가능하다. 기존 review.mjs의 커밋 기반 공식 리뷰와 별개다.

실행 한 번의 범위는 현재 프로젝트다. 공용 설치는 별도 bootstrap.py가 수행하며 다른 프로젝트의 제품 규칙을 복사하지 않는다.

## 앱과 경로

VS Code·Claude Code·Codex 어느 진입점이든 Claude가 먼저 역할을 배분한다. Codex에서 시작하면 읽기 전용 요청(from=codex, to=claude, writePaths=[])에 사용자 과제와 완료 기준을 전달한다. Claude가 정한 배분을 현재 앱이 실행·전달하며 결과를 Claude에게 돌려준다. 이미 Claude가 배분한 작업 안에서는 재배분을 위한 재귀 호출을 하지 않는다. 이 배분 요청이 실패하면 아래 "한쪽 사용 불가 시"를 따른다.

WSL은 경로의 대소문자를 구분한다. 기존 폴더가 Tools이면 Tools/shared-agents 경로를 사용한다. 설치기가 프로젝트 AGENTS.md 앞부분에 정확한 상대 경로를 기록한다.

요청에 timeoutMs를 선택적으로 지정할 수 있다(100~600000ms, 기본 600000). 실행 시간 초과는 실패로 기록한다. 쓰기 경로는 기존 심볼릭 링크를 해석해 프로젝트 밖으로 나가면 거부한다. 강제 종료로 active.lock이 남으면 해당 PID와 실행 종료를 확인한 뒤 그 잠금만 복구한다.

## 한쪽 사용 불가 시 (2026-10-19 사용자 지시)

실행기 v2.2는 실패한 실행의 execution.json에 failureKind를 기록한다: usage_limit(사용량 한도·요청 과다로 보이는 CLI 오류, 해당 줄은 limitHint), timeout, error. 판정은 CLI 출력 끝부분의 오류 문구를 기준으로 하는 추정이며 stderr로 확인한다.

- usage_limit: 재시도하지 않는다. 원인과 알 수 있는 재개 시각을 작업 기록에 남기고 사용자에게 "<쪽> 한도로 <다른 쪽> 단독 진행 중"이라고 한 줄로 알린다.
- timeout·error: 원인을 확인한 뒤 한 번만 재시도할 수 있다. 다시 실패하면 사용 불가로 보고 아래 대체 절차를 따른다. 로그인 만료도 사용 불가로 보며 로그인을 대신 바꾸지 않는다.
- Claude 사용 불가: Codex가 임시로 역할 배분·조율과 작업을 맡는다. 작업 기록에 "Claude 불가로 Codex 임시 조율"과 원인을 남기고, Claude가 복귀하면 Claude가 그 기록과 결과를 확인한다. 이것이 "Claude가 항상 배분" 규칙의 유일한 예외다.
- Codex 사용 불가: Claude가 설계·구현·검증을 혼자 맡는다. 그래픽 작업은 Codex 복귀까지 대기한다. SVG·CSS처럼 코드로 만드는 그래픽은 사용자에게 확인한 뒤 Claude가 진행할 수 있다.
- 저장·인증·결제·삭제·배포 등 교차 리뷰 대상은 구현까지만 하고 "교차 리뷰 대기"로 기록한다. 상대가 복귀하면 리뷰한다. 단독 진행을 리뷰 통과로 기록하지 않는다.
- 양쪽 모두 사용 불가: 현재 상태와 다음 행동을 작업 기록에 남기고 멈춘다.
