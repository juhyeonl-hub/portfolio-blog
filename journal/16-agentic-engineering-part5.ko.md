---
title: "품질 루프 기반 에이전틱 엔지니어링 (Part 5)"
excerpt: "writer 뒤에 reviewer를 붙이고, quality gate에는 명시적인 라우팅 정책, 튼튼한 파싱, 재시도 제한이 필요하다는 걸 배운 기록."
tags: [Dev, AI, Agentic]
---

Part 4의 끝에는 작은 문제가 있었다. 직접 만든 supervisor는 단계를 건너뛸 수 있었다. 가벼운 질문에서는 `researcher`를 한 번 부르고 바로 끝냈다. 효율적이긴 하다. 하지만 제품 요구사항이 *"모든 답변은 분석, 작성, 리뷰를 반드시 거쳐야 한다"* 라면 목표는 효율이 아니라 제어다.

그래서 Part 5에서는 **quality loop**를 추가했다.

![LangGraph supervisor 시스템의 quality loop](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/16_quality_loop.svg)

새로 들어온 작업자는 `reviewer`다. writer가 답변을 만들면 reviewer는 둘 중 하나를 반환한다.

```text
PASS: 답변이 충분히 좋다
REVISE: 이 부분을 개선해야 한다
```

`PASS`면 그래프가 끝난다. `REVISE`면 다시 researcher, analyst, writer를 거친다. 그리고 `MAX_REVISIONS = 2`도 넣었다. 탈출구 없는 quality loop는 정중한 무한 루프일 뿐이다.

## state에 무엇이 추가됐나

Part 4의 state는 메시지와 supervisor의 다음 결정만 있으면 됐다.

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str
```

Part 5에서는 리뷰 상태가 추가된다.

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str
    review_status: str
    revision_count: int
```

작은 추가처럼 보이지만 시스템의 모양이 달라진다. 이제 그래프는 *무슨 말이 오갔는지*뿐 아니라, *결과물이 품질 검사를 통과했는지*, *몇 번이나 다시 시도했는지*를 기억할 수 있다.

시스템 작업을 하면서 계속 보게 되는 패턴이다. state가 있어야 policy가 생긴다. state가 없으면 모든 게 프롬프트 느낌에 의존하게 된다.

## reviewer 노드

reviewer는 일부러 엄격하게 만들었다. 답변을 다시 쓰지 않는다. 판단만 한다.

```python
reviewer_agent = create_react_agent(
    model=model,
    tools=[],
    prompt=(
        "You are a strict reviewer. Review the writer's latest answer.\n"
        "Return exactly one of these formats:\n"
        "PASS: <one-sentence reason>\n"
        "REVISE: <specific feedback for what to improve>"
    ),
)
```

그리고 그래프는 그 라벨을 파싱한다.

```python
review = str(last_msg.content).strip()
review_upper = review.upper()
pass_index = review_upper.find("PASS:")
revise_index = review_upper.find("REVISE:")

status = "PASS" if pass_index != -1 and (
    revise_index == -1 or pass_index < revise_index
) else "REVISE"
```

처음에는 훨씬 단순하게 시작했다.

```python
status = "PASS" if review.upper().startswith("PASS") else "REVISE"
```

그리고 바로 깨졌다. reviewer는 실제로 `PASS`를 반환했는데, 메시지 앞에 routing 로그성 텍스트가 섞여 있었다. 그래서 파서는 `PASS`로 시작하지 않는다고 판단했고, 결과를 `REVISE`로 처리했다. 답변은 통과했는데 그래프는 다시 루프로 들어갔다.

좋은 버그였다. LLM 출력이 제어 신호가 되는 순간, 파싱은 단순한 포맷 문제가 아니다. 시스템 correctness의 일부가 된다.

## 자율성보다 먼저 정책

첫 실행은 또 다른 문제도 보여줬다. reviewer를 추가했는데도 supervisor는 너무 빨리 끝내려 했다. researcher 답변이 괜찮아 보이자 analyst, writer, reviewer를 거치기 전에 `FINISH`를 선택했다.

그래서 supervisor를 진실의 원천처럼 다루는 걸 멈췄다. 이제 그래프가 최소 흐름을 먼저 강제하고, 그 다음에야 LLM에게 판단을 맡긴다.

```python
if researcher_index == -1:
    next_node = "researcher"
elif analyst_index < researcher_index:
    next_node = "analyst"
elif writer_index < analyst_index:
    next_node = "writer"
else:
    # only now ask the supervisor model
```

Part 5의 핵심은 이거다. **모델은 경계 안에서 선택하게 하고, 경계는 그래프가 정의해야 한다.**

supervisor는 유연한 판단에 유용하다. 하지만 절대 지켜야 하는 제품 요구사항을 저장해둘 장소는 아니다. 모든 보고서가 반드시 리뷰를 거쳐야 한다면, 리뷰를 그래프의 edge로 만들어야 한다. supervisor가 기억해주길 바라면 안 된다.

## 실제 실행

라우팅 정책과 파서를 고친 뒤, trace는 의도한 모양이 됐다.

```text
supervisor -> researcher
supervisor -> analyst
supervisor -> writer
writer -> reviewer
reviewer -> PASS
END
```

최종 reviewer 출력은 이랬다.

```text
PASS: The answer directly defines LangGraph in one clear paragraph...
```

작은 예제지만 구조가 중요하다. 실제 시스템에서는 reviewer가 출처 커버리지, 톤, hallucination 위험, 누락된 citation, 정책 위반, rubric 만족 여부를 볼 수 있다. reviewer가 완벽하다는 게 핵심은 아니다. 품질을 명시적으로 검사하는 자리가 시스템 안에 생겼다는 게 중요하다.

## 가져갈 것

**품질은 프롬프트 형용사가 아니라 루프다.** "좋은 답변을 써라"보다, 답변을 거절할 수 있는 reviewer 노드를 두는 쪽이 훨씬 강하다.

**제어 신호는 엔지니어링 대상이다.** `PASS`와 `REVISE`는 단순해 보이지만, 파서, 재시도 횟수, fallback 동작이 루프의 안전성을 결정한다.

**그래프 정책은 모델의 기억보다 강하다.** 반드시 일어나야 하는 단계라면 라우팅에 넣어야 한다. 프롬프트는 판단에 좋고, 그래프는 보장에 좋다.

**worker 입력에는 현재 작업 지시가 필요하다.** supervisor routing 메시지를 worker context에서 제거했더니 일부 agent가 빈 응답을 냈다. 해결책은 각 노드에서 `HumanMessage`를 붙이는 것이었다. 지금은 research해라, analyze해라, write해라, review해라. agent 노드는 history뿐 아니라 현재 job도 알아야 한다.

## 다음

이제 시스템에는 specialist, supervisor, quality gate가 있다. 다음 문제는 **memory**다. 무엇을 실행 사이에 보존하고, 무엇을 버릴 것인가?

장난감 그래프에서는 짧은 message history만으로 충분하다. 하지만 실제 research agent에는 오래 남는 노트, source record, 이전 결정, 중단 후 재개 방법이 필요하다. 그 지점부터 프로젝트는 "agent workflow"에서 "agentic system"으로 넘어간다.

Part 6는 그쪽으로 가면 좋겠다.

*To be continued.*
