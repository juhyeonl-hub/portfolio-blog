---
title: "오케스트레이션 기반 에이전틱 엔지니어링 (Part 4)"
excerpt: "한 멀티툴 에이전트를 supervisor 아래 세 명의 전문가로 쪼개고 — 같은 걸 두 번 만들어보면서, 라이브러리가 무엇을 가려놨는지 들여다보기."
tags: [Dev, AI, Agentic]
---

Part 3에서는 단일 에이전트의 도구 목록을 셋으로 늘렸다. 이번에는 그 한 명의 멀티툴 에이전트를 **세 명의 전문 에이전트**로 쪼개고 그 위에 supervisor를 얹었다. 같은 걸 두 가지 방식으로 만들었다 — 한 번은 라이브러리로, 한 번은 손으로 — 그 비교가 결국 핵심 교훈이 됐다.

## 왜 단일 에이전트를 쪼개는가

Part 3까지의 에이전트는 검색도 하고, 분석도 하고, 직접 글도 썼다. 짧은 질문엔 충분했지만, 한 명에게 모든 역할을 맡기면 시스템 프롬프트가 늘어진다 — *"너는 검색도 잘하고 분석도 잘하고 글도 잘 쓰는…"* — 그러면 모델이 어느 모드에 있는지 흐릿해진다. 출력 톤이 흔들리고, 뭔가 잘못됐을 때 "어느 단계가 문제였지?"는 쉽게 답할 수 있는 질문이 아니다.

해법은 **관심사 분리**다. 한 명의 만능 프리랜서 대신, 세 명의 전문가를 고용한다.

- `researcher`: 웹 검색과 본문 수집만. Part 3의 도구 셋(`web_search`, `get_current_date`, `fetch_url`)을 그대로 물려받는다.
- `analyst`: 수집된 자료에서 패턴, 모순, 출처 신뢰도를 정리. 도구 없음, 추론만.
- `writer`: 분석을 받아 마크다운 보고서로 작성. 도구 없음.

각자의 시스템 프롬프트는 짧고 한 가지에만 집중한다. 그 위에 누구를 부를지 정하는 `supervisor`가 앉는다.

## 같은 걸 두 가지 방식으로 만들기

같은 시스템을 일부러 두 번 만들었다 — 한 번은 라이브러리로(Version A), 한 번은 `StateGraph`로 손으로(Version B). 동작은 같은데, 가르쳐주는 게 다르다.

![두 가지 라우팅 메커니즘이 있는 supervisor 패턴](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/15_supervisor_pattern.svg)

### Version A — `create_supervisor()`

`langgraph-supervisor` 라이브러리의 `create_supervisor()` 한 줄이면 끝난다. 에이전트 셋을 만들고, supervisor 프롬프트를 적고, 컴파일.

```python
supervisor = create_supervisor(
    agents=[researcher, analyst, writer],
    model=model,
    prompt="You are a supervisor managing three specialists: ...",
).compile()
```

흐름이 깔끔하게 찍힌다.

```
supervisor → researcher → supervisor → analyst →
supervisor → writer → supervisor → FINISH
```

매 sub-agent가 작업을 끝낼 때마다 supervisor에게 돌아오고, supervisor가 다음 누구를 부를지 결정한다. 라이브러리 내부의 라우팅 메커니즘은 의외로 단순하다 — supervisor에게 `transfer_to_researcher`, `transfer_to_analyst` 같은 **도구**가 자동으로 붙고, 다음 에이전트를 정하는 건 그 도구를 호출하는 행위로 표현된다. 평소 도구 호출 패턴이 라우팅 모자를 쓰고 등장한 셈이다.

편하긴 한데 몇 가지가 가려진다. sub-agent 안에서 어떤 도구가 어떤 인자로 호출됐는지가 stream에 안 잡힌다. 흐름에 끼어들어 커스텀 로직을 넣을 자리도 없다. 라이브러리의 "다 알아서 해줄게"는 동시에 — "들여다볼 수 없게 해줄게"이기도 하다.

### Version B — `StateGraph`로 처음부터 만들기

같은 동작을 `langgraph-supervisor` 없이 짠다. 코드는 약 1.5배 길어지지만 모든 부분이 보인다.

핵심은 네 가지.

**State**는 모든 노드가 공유하는 화이트보드다. 메시지 누적은 LangGraph의 `add_messages` reducer가 "새 메시지를 반환한다"를 "리스트에 append한다"로 바꿔주기 때문에 동작한다.

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str  # the supervisor's decision: which node next
```

**Supervisor 노드**는 도구 호출이 아니라 **텍스트 분류**로 결정한다. 시스템 프롬프트로 한 단어만 받아내라고 시키고 — `researcher` / `analyst` / `writer` / `FINISH` — 응답을 파싱해 `state["next"]`에 적는다.

```python
def supervisor_node(state: AgentState) -> dict:
    response = model.invoke(
        [{"role": "system", "content": SUPERVISOR_PROMPT}] + state["messages"]
    )
    decision = response.content.strip().lower()
    if "finish" in decision:        next_node = "FINISH"
    elif "researcher" in decision:  next_node = "researcher"
    elif "analyst" in decision:     next_node = "analyst"
    elif "writer" in decision:      next_node = "writer"
    else:                           next_node = "FINISH"
    return {"messages": [...], "next": next_node}
```

**라우팅 함수**는 `state["next"]`를 읽어 LangGraph에게 다음 노드를 알려준다.

```python
def route_after_supervisor(state):
    return END if state["next"] == "FINISH" else state["next"]
```

**그래프 조립**에서 `add_conditional_edges`가 모든 걸 엮는다. 모든 sub-agent는 끝나면 무조건 supervisor로 돌아온다.

```python
graph_builder.add_conditional_edges(
    "supervisor", route_after_supervisor,
    {"researcher": "researcher", "analyst": "analyst",
     "writer": "writer", END: END},
)
graph_builder.add_edge("researcher", "supervisor")
graph_builder.add_edge("analyst", "supervisor")
graph_builder.add_edge("writer", "supervisor")
```

이게 전부다. 라이브러리가 가려놨던 게 표면으로 올라왔다.

## 도구 호출 vs 텍스트 분류

두 버전의 진짜 차이는 라우팅 메커니즘이다 — 같은 결정 ("다음은 누가?") 을 두 가지 다른 출력 형식으로 표현하는 차이.

| | Version A | Version B |
|---|---|---|
| 입력 (지시) | 자연어 프롬프트 | 자연어 프롬프트 |
| 출력 형식 | 도구 호출 (JSON) | 일반 텍스트 (`"researcher"`) |
| 라우팅 처리 주체 | LangGraph 내부 | 우리 함수가 파싱 |
| 인자 전달 | 쉬움 | 어색 |
| 커스텀 끼어들기 | 어려움 | 쉬움 |

도구 호출은 선택지가 많거나 호출에 구조화된 인자가 필요할 때 깔끔하다. 텍스트 분류는 선택지가 적고 결정이 빨라야 할 때 더 잘 맞는다 — 도구 정의 토큰이 빠지니까 약간 더 싸기도 하다. 우리 supervisor는 네 라벨 중 하나를 고르는 일이라 후자가 자연스럽다.

## 실제 쿼리에서 무슨 일이 일어났나

같은 질문 — *"What is LangGraph in one paragraph?"* — 을 두 버전에 던져봤다. 흥미로운 건 Version B에서 supervisor가 `researcher`를 한 번만 부르고 곧장 FINISH로 갔다는 점이다. 검색 결과가 이미 한 문단짜리 답으로 충분했고, supervisor가 그걸 알아본 거다. `analyst`와 `writer`는 건너뛰었다.

이게 좋은가 나쁜가는 상황에 따라 다르다. 가벼운 질문엔 효율적이지만 — *"모든 보고서는 분석과 글쓰기를 거친다"* 같은 제품 요구가 있다면 supervisor의 자율성이 거꾸로 문제다. Version B에선 라우팅 함수 안에 "어떤 에이전트들이 이미 일했는지"를 추적해 강제 순서를 넣을 수 있다. Version A에선 거의 불가능하다. **이게 직접 짠 그래프의 진짜 가치다.**

## 가져갈 것

다음 단계로 가기 전에 세 가지를 적어둔다.

**멀티에이전트는 무료가 아니다.** LLM 호출 횟수가 늘고(이 질문에 7번), 비용이 두세 배 뛰고, 응답이 느려진다. 단일 에이전트로 충분한지 먼저 묻고, 안 될 때만 쪼개는 게 맞다. Anthropic 자신의 가이드도 멀티에이전트를 마지막 수단으로 다룬다 — 직접 만들어본 뒤로는, 그게 회사 입장 표명이 아니라 설계 규칙이라는 게 보인다.

**라이브러리는 학습을 가린다.** Version A에서 멈췄다면 supervisor 패턴을 "썼다"고는 할 수 있어도 "안다"고는 할 수 없다. Version B로 다시 짓고서야 state, edge, routing이 머리에 박혔다. 채용 시장이 "프레임워크 없이 같은 걸 만들 수 있는가"를 묻는 게 — 이쪽 작업을 해본 뒤로 더 자연스럽게 이해된다.

**Supervisor의 결정은 출력 형식의 문제로 귀결된다.** 도구 호출이든 텍스트 라벨이든 본질은 *"LLM에게 어떻게 답하라고 할 건가"*다. 이 한 가지가 라우팅 메커니즘의 거의 전부였다.

## 다음

Part 5에서는 이 위에 **품질 루프**를 얹는다. reviewer가 writer의 결과를 검토하고, 부족하면 researcher로 다시 돌려보내는 구조. 그 결정을 supervisor의 자율 판단에 맡길지, 라우팅 함수에서 강제할지 — 오늘 봤던 트레이드오프가 한 단계 더 깊은 형태로 다시 등장한다.

직접 짠 그래프가 진짜로 빛나기 시작하는 지점일 것이다.

*To be continued.*
