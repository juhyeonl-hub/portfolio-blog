---
title: "오케스트레이션 기반 에이전틱 엔지니어링 (Part 3)"
excerpt: "ReAct 에이전트에 도구 두 개를 더 붙이고 — 함수 이름이 docstring보다 LLM에게 도구를 더 잘 설명한다는 사실을 발견하기까지."
tags: [Dev, AI, Agentic]
---

## 왜 멀티툴인가

Part 2에서 만든 ReAct 에이전트는 검색 도구 하나만 가진 단출한 친구였다. 질문하면 Tavily로 검색하고, 결과 스니펫을 읽고 답변하는 식. 잘 동작했지만 한계도 명확했다 — 스니펫이 짧으면 답변도 얕았고, "최신"이라는 단어가 들어간 질문에는 학습 시점 기준의 낡은 답을 내놓을 때가 있었다.

그래서 Part 3에서는 도구를 두 개 더 붙여 봤다. 멀티툴 환경에서 에이전트가 어떻게 도구를 골라 쓰는지가 궁금했고, 그 과정에서 "도구를 LLM에게 어떻게 설명해야 잘 쓰는가"라는 질문에 답을 얻고 싶었다.

## 무엇을 만들었나

`03_agent_with_tools.py`. Part 2의 그래프 골격은 그대로 두고, 도구만 1개 → 3개로 늘렸다.

- **`get_current_date`** — 오늘 날짜를 `YYYY-MM-DD`로 반환. "최신", "현재", "지금" 같은 시간성 질문이 들어오면 먼저 이걸 호출하고, 연도를 검색 쿼리에 끼워 넣게 만들었다.
- **`fetch_url`** — 검색 결과의 URL을 받아서 본문을 추출. `requests`로 받아 `BeautifulSoup`으로 `script`/`style`/`nav`/`footer` 같은 노이즈를 걷어내고, 5000자에서 자르고, 타임아웃·HTTP 에러를 깔끔한 메시지로 리턴.
- 시스템 프롬프트에 "언제 어떤 도구를 부를지", "fetch_url은 1~2개만"이라는 협력 규칙 추가.

```python
@tool
def get_current_date() -> str:
    """Returns today's date in YYYY-MM-DD format.

    Use this whenever the user asks about "latest", "recent", "current",
    or anything time-sensitive. Knowing today's date helps you formulate
    better search queries (e.g., adding the year to find truly recent info).
    """
    return datetime.now().strftime("%Y-%m-%d")
```

이 코드 자체는 평범하다. 진짜 흥미로운 건 따로 있었다.

## graph.stream()으로 행동을 들여다보다

`graph.invoke()`만 쓰면 최종 답변만 보인다. 그런데 멀티툴이 되니까 "이 녀석이 도구를 어떤 순서로, 몇 번이나 호출하는지"가 궁금해졌다. 그래서 `graph.stream()`으로 매 노드의 출력을 실시간으로 찍어봤다.

```python
for chunk in graph.stream(...):
    for node_name, node_output in chunk.items():
        last_msg = node_output["messages"][-1]
        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            for tc in last_msg.tool_calls:
                print(f"tool call: {tc['name']}, args: {tc['args']}")
```

질문은 *"Tell me about Anthropic's latest Claude model, Opus 4.7, and its key improvements."*

에이전트는 다음 순서로 움직였다:

1. `get_current_date` — 오늘 날짜로 시간 기준 잡기
2. `tavily_search`, 연도까지 끼워서: `"Claude Opus 4.7 2026"`
3. `fetch_url`로 가장 권위 있는 결과의 본문
4. `fetch_url`을 한 번 더, 두 번째 권위 있는 출처에

내가 시스템 프롬프트에 적은 작동 원칙 그대로였다. "보인다"는 게 강력했다. 디버깅이라기보단 — 머릿속에 있던 "에이전트가 추론한다"는 추상이 구체적인 실행 시퀀스로 바뀌는 순간이었다.

## 진짜 발견 — 함수 이름이 docstring을 이긴다

여기서 멈출 수도 있었지만, 한 가지 가설을 시험해보고 싶었다 — **"docstring을 망가뜨리면 LLM이 헷갈릴까?"**

> 잠깐 — *docstring*이 뭐냐면, 파이썬 함수 정의 바로 아래에 `"""..."""`로 감싸 적어두는 설명문이다. 사람이 읽기 위한 문서이기도 하지만, LangChain의 `@tool` 데코레이터는 이 docstring을 읽어서 LLM에게 "이 도구가 뭐 하는 건지" 설명하는 데 그대로 사용한다. 그러니까 docstring을 잘 쓰는 게 "LLM에게 도구를 잘 설명하는 일"과 같다고 — 적어도 처음엔 — 그렇게 믿고 있었다.

3차에 걸쳐 같은 질문, 같은 도구 구성, docstring과 시스템 프롬프트만 점진적으로 부숴봤다.

| 실험 | docstring          | 시스템 프롬프트       | 내 예상              | 실제 결과            |
|:---:|:-------------------|:----------------------|:---------------------|:---------------------|
| 1차 | 풍부               | 풍부                  | 잘 동작할 것         | 도구 4회, 깊이 있는 답변 |
| 2차 | `"Fetches a URL."` | 풍부                  | 약간 헤맬 것         | **동일**             |
| 3차 | `"Fetches a URL."` | `"Fetches a URL"`     | 도구 선택 실패할 것  | **동일**             |

예상은 빗나갔다. docstring을 한 줄로 줄이고 시스템 프롬프트를 거의 빈 껍데기로 만들어도, Claude Haiku 4.5는 `fetch_url(url: str)`이라는 **시그니처만 보고** 정확히 같은 시점에 같은 도구를 불렀다.

이게 우연이 아니었다는 게 핵심이다. 함수 이름과 타입 힌트만으로 LLM은 이미:

- "이 함수는 URL을 가져오는 거구나"
- "검색 결과 다음에 부르는 게 자연스럽겠다"

까지 추론하고 있었다. docstring과 시스템 프롬프트는 **이미 추론된 결과를 보강하는 정도**였던 거다.

### 그래서 얻은 디자인 원칙

이걸로 도구 설계할 때 머릿속 우선순위가 정리됐다.

![LLM이 도구를 이해하는 네 가지 신호](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/14_signal_hierarchy.svg)

1. **함수 이름이 1차 신호다.** `fetch_url`, `get_current_date`처럼 동사+명사로 의도가 한 번에 보이게. `do_thing` 같은 이름은 LLM에게도 사람에게도 똑같이 나쁘다.
2. **타입 힌트는 인자 이해의 결정타다.** `url: str` 한 줄이 "이건 URL 문자열을 받는다"를 확정한다.
3. **docstring은 함수 이름으로 표현 못 하는 것을 위한 것이다.** "언제 호출하지 마라", "1~2개만 호출해라" 같은 *제약*이나 *호출 시점*. 함수가 뭐 하는지를 다시 설명하는 docstring은 토큰 낭비다.
4. **시스템 프롬프트는 도구 *간*의 협력 규칙이다.** 단일 도구의 사용법이 아니라 "검색 → 본문 → 답변" 같은 다단계 흐름.
5. 이 셋이 **중복돼 있을 때 가장 견고하다.** 한 신호가 약해도 다른 신호가 메꾼다. 다중 방어선.

## Part 3 끝나는 시점에서

처음 이 시리즈를 시작할 때 "에이전틱 엔지니어링 시스템을 만든다"고 거창하게 말했지만, 솔직히 인정해야 할 것 같다 — 지금 만들고 있는 건 **에이전트 1개**다. 시스템이라고 부를 만한 무언가는 한참 멀었다.

그래도 부품을 만들 줄 아는 능력은 쌓이고 있다. State, ReAct 루프, 멀티툴, stream 관찰. 정원처럼 봐야 한다고 생각했다 — 한 번에 큰 설계를 끝내는 게 아니라, 식물 하나씩 심으면서 키워가는 것.

## 다음

도구를 더 늘리는 것보다 중요한 건 — **메모리**다. 지금 에이전트는 한 번 답하고 끝이다. 후속 질문이 들어오면 처음부터 다시 검색한다. 짧은 대화 컨텍스트라도 유지할 수 있다면 — 그리고 검색 결과를 캐싱할 수 있다면 — 같은 정원에 두 번째 화분이 놓이는 셈이다.

*To be continued.*
