---
title: "오케스트레이션 기반 에이전틱 엔지니어링 (Part 2)"
excerpt: "첫 LangGraph 에이전트 만들기 — 가장 단순한 ReAct 루프, 그리고 그래프는 완벽히 동작했는데도 에이전트가 검색을 거부했던 순간."
tags: [Dev, AI, Agentic]
---

Part 1에서 프로젝트 골격과 설계 원칙을 정리했다. 이번 글은 LangGraph로 첫 에이전트를 실제로 만드는 이야기다 — 검색 도구 한 개를 가진 단일 LLM, 가장 단순한 형태의 ReAct 루프. 코드는 짧지만, 만드는 과정에서 예상보다 많은 게 드러났다.

## 만들고 싶었던 것

질문을 받고, 필요할 때 웹 검색을 하고, 신선한 정보로 답하는 에이전트. 네 가지 개념이 머리에 박혀야 했다.

- **State**: 한 번의 실행 동안 누적되는 메시지 기록
- **Node**: state를 읽고 업데이트를 반환하는 함수
- **Edge**: 노드 사이의 연결 (무조건 또는 조건부)
- **ReAct loop**: think → act → observe, 끝날 때까지 반복

## State 정의가 처음에 이상하게 보이는 이유

가장 오래 끌린 한 줄.

```python
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
```

기본적으로 LangGraph는 업데이트가 들어올 때마다 state 필드를 덮어쓴다. 노드가 `{"messages": [new_message]}`를 반환하면, 메시지 리스트 전체가 교체된다. 그런데 대화형 에이전트는 history가 누적돼야 한다. `add_messages` reducer가 LangGraph에게 알려준다 — 덮어쓰지 말고, append해라.

파이썬의 `Annotated`는 원래 타입에 메타데이터를 붙이는 수단이었다. LangGraph는 그걸 state 업데이트 규칙을 전달하는 채널로 재활용한다. 처음엔 이상해도, 한 번 이해되면 깔끔하다 — 결합 규칙이 필드 선언 바로 옆에 산다.

## LLM이 도구를 "안다"는 게 무슨 뜻인가

`llm.bind_tools([search_tool])`이 핵심 한 줄이다.

LLM은 도구를 등록해주지 않으면 그게 존재하는지조차 모른다. 바인딩이 끝나면 응답이 두 가지 형태 중 하나로 들어온다 — 일반 텍스트, 또는 `tool_calls` 필드에 "이 도구를 이 인자로 호출해라"는 구조화된 신호가 담긴 `AIMessage`. 프레임워크가 그걸 잡아 도구를 실행하고, 결과를 다시 모델에 먹인다.

흥미로운 건 — **LLM 자신이 도구를 호출할지 말지를 결정한다는 점이다.** "쿼리에 X가 들어가면 검색해라"를 하드코딩하지 않는다. 모델의 판단을 신뢰한다. 이 신뢰가 그날의 핵심 이슈가 됐다.

## 그래프 조립

```
START → agent → (conditional) → tools → agent → ... → END
```

`agent` 노드가 끝날 때마다 LangGraph가 마지막 메시지를 본다. 도구 호출이 있으면 → `tools`로 라우팅. 없으면 → `END`. 내장된 `tools_condition`이 그 검사를 처리한다. `tools` 실행 후에는 다시 `agent`로 돌아오고, LLM은 답을 마무리하거나 다시 검색을 요청한다. 이 사이클이 ReAct 루프의 가장 단순한 형태다.

## 첫 실행 — 그리고 예상 못한 거부

질문: *"What's the latest Claude model Anthropic released in 2026?"*

답:

> "I'm sorry, but I can't retrieve information about 2026. At the current point in time, 2026 is in the future, so those events haven't happened yet."

**검색을 아예 하지 않았다.** LLM이 "2026 = 미래"라고 판단하고 도구를 호출하지 않은 채 종료해버렸다.

내 그래프는 설계대로 정확히 동작했다. 문제는 **LLM이 지금이 언제인지 전혀 모른다는 것**이었다. 학습 컷오프 이후의 모든 것이 "미래"로 보인다. 셋업 어디에도 그렇지 않다고 알려주는 게 없었다.

## 해법 — 시스템 프롬프트

코드 변경 없음. 프롬프트만 바꿨다.

```python
SYSTEM_PROMPT = """You are a research agent that answers using web search.

Current date: April 22, 2026

# Operating principles
1. Your training data may be outdated. For current information, use TavilySearch
   before answering.
2. If a date in the question is before the current date, it's the PAST, not the
   future — it's searchable. Try searching before saying "I don't know."
"""
```

`agent_node` 안에서 매 LLM 호출마다 `SystemMessage`로 앞에 붙였다. 같은 질문 두 번째 실행 — 에이전트가 Tavily를 호출하고, 실제 결과를 받아 "Claude Opus 4.7, released April 9, 2026"이라고 답했다. 출처와 함께. 같은 코드, 다른 프롬프트.

## 여기서 배운 것

**구조적 정확성 ≠ 행동적 정확성.** 그래프가 흠 없어도 에이전트가 원하는 대로 안 움직일 수 있다 — 그래프와 프롬프트는 서로 다른 두 레이어다. 그래프는 무엇이 *가능한지*를 정의하고, 프롬프트는 매 LLM 호출 안에서 *실제로 무엇이 일어나는지*를 형성한다.

특히 놀라웠던 건 — *지금이 몇 년인지* 같은 배경 컨텍스트조차 명시적으로 말해줘야 한다는 점이다. LLM은 시간 감각을 스스로 들고 있지 않다. "지금"에 의존하는 행동을 원하면, "지금"을 주입해야 한다.

한 가지 더 — 시스템 프롬프트를 State 안에 넣지 않았다. 노드 함수 안에서 매 호출 시 앞에 붙인다. 그게 정체성(시스템 프롬프트)과 메모리(대화 history)를 분리해둔다. 둘은 다른 시간 척도에 살고, 아마 다른 곳에 있어야 한다.

## 처음부터 가드레일

학습용 프로젝트라도 미리 깔아둘 만한 안전장치 몇 가지.

- `recursion_limit=10` — 크레딧이 타기 전에 폭주 루프를 잡는다
- `temperature=0` — 디버깅 쉬운 결정론적 출력
- `max_tokens=1024` — 한 번의 생성 길이 제한
- 그래프 실행 전 키 검증

이 검증이 즉시 효과를 봤다. 첫 실행이 HTTP 스택 깊은 곳에서 `UnicodeEncodeError`로 죽었다. 원인 — `.env`에 실제 키 대신 한국어 placeholder를 그대로 둔 거였다. HTTP 헤더는 ASCII만 받기 때문에, 비-ASCII 문자가 인코딩 시점에 폭발했다. 미리 검증을 해두니, 이게 스무 줄 스택 트레이스 대신 한 줄 에러가 됐다.

## 다음

Part 3에서는 **supervisor + 멀티에이전트 오케스트레이션**으로 넘어간다. 오늘 만든 에이전트를 빌딩 블록으로 삼아서, researcher / analyst / writer 에이전트가 따로따로 있는 시스템을 supervisor가 라우팅하게 만든다. 그 과정에서 단일 에이전트로 충분한 지점은 어디인지, 오케스트레이션 비용이 정말 정당화되는 지점은 어디인지를 같이 들여다볼 생각이다.

*To be continued.*
