---
title: "검색 기반 에이전틱 엔지니어링 (Part 7)"
excerpt: "저장된 memory를 실제 실행 시작점에서 다시 꺼내 쓰면서, retrieval이 단순 검색이 아니라 시스템 정책이라는 걸 배운 기록."
date: 2026-05-15
tags: [Dev, AI, Agentic]
---

Part 6에서는 durable memory를 만들었다. researcher, analyst, writer, reviewer가 각자의 record를 JSONL에 남겼고, 그래프는 한 번의 실행을 넘어서 무언가를 보존할 수 있게 됐다.

하지만 저장은 절반이다. 오늘의 주제는 **retrieval**이다.

![Memory retrieval flow](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/18_memory_retrieval.svg)

memory가 있어도 꺼내 쓰지 못하면 로그와 다르지 않다. 반대로 아무거나 다 꺼내오면 agent는 과거의 소음에 묻힌다. 그래서 Day 8의 핵심 질문은 이거였다.

```text
새 질문이 들어왔을 때, 어떤 memory record를 context로 가져와야 하는가?
```

## 저장소에서 검색기로

Part 6의 memory store는 append 중심이었다.

```python
memory.append(run_id, "research_note", {...})
memory.append(run_id, "source_record", {...})
memory.append(run_id, "review_decision", {...})
```

오늘은 여기에 `search()`를 붙였다.

```python
def search(self, query: str, limit: int = 5) -> list[MemoryRecord]:
    records = self.load()
    scored = [
        (self._score(query, record), record)
        for record in records
    ]
    return [
        record
        for score, record in sorted(scored, reverse=True)
        if score > 0
    ][:limit]
```

대단한 알고리즘은 아니다. 지금은 query token과 record payload의 겹침을 본다. 그래도 이 작은 함수가 생기자 구조가 달라졌다. memory는 더 이상 저장만 하는 파일이 아니라, 실행 전에 호출되는 시스템 컴포넌트가 됐다.

## memory_loader의 책임

retrieval은 worker 안에 넣지 않았다. supervisor 앞에 있는 `memory_loader`가 담당하게 했다.

```python
graph_builder.add_edge(START, "memory_loader")
graph_builder.add_edge("memory_loader", "supervisor")
```

이 선택이 마음에 들었다. researcher가 memory를 찾게 만들 수도 있다. 하지만 그러면 모든 worker가 "무엇을 기억해야 하는가"를 각자 판단하게 된다. 이번에는 검색을 그래프의 시작 정책으로 만들었다.

```python
def memory_loader_node(state: AgentState) -> dict:
    question = _first_human_question(state["messages"])
    records = memory.search(question, limit=5)
    context = format_memory_context(records)

    return {
        "messages": [AIMessage(content=context, name="memory")],
        "memory_context": context,
    }
```

이제 worker들은 같은 memory context를 보고 시작한다. 시스템의 출발점이 안정된다.

## 모든 기억은 증거가 아니다

retrieval을 붙이자 바로 위험한 패턴이 보였다. agent는 memory에 있는 말을 꽤 쉽게 사실처럼 사용하려고 한다.

그래서 researcher prompt에 다시 규칙을 넣었다.

```text
Durable memory is context. It can suggest where to look.
It is not evidence. Verify important claims with fresh sources.
```

이 규칙은 앞으로 계속 중요할 것 같다. memory가 커질수록 agent는 과거의 결론을 재사용하고 싶어 한다. 하지만 research agent에서 오래된 memory는 출발점이지 근거가 아니다.

## context는 작아야 한다

처음에는 record 전체를 message에 넣었다. 금방 지저분해졌다. `id`, `run_id`, `created_at`, nested payload가 그대로 들어가니 worker가 읽어야 할 정보보다 포맷 노이즈가 더 많았다.

그래서 memory context를 압축했다.

```text
Relevant memory:
- [research_note] Previous run found that LangGraph checkpoint state and durable memory solve different problems.
- [review_decision] Reviewer asked for clearer separation between memory as context and memory as evidence.
```

agent에게 필요한 건 database dump가 아니라 작업 전 힌트다. 작은 요약이 더 좋았다.

## 가져갈 것

**Memory retrieval은 검색 기능이 아니라 정책이다.** 무엇을 가져올지, 몇 개를 가져올지, 어떤 형식으로 줄지에 따라 agent의 행동이 달라진다.

**검색은 worker보다 그래프에 가까운 책임이다.** 모든 worker가 각자 기억을 찾게 하면 시스템의 출발점이 흔들린다. 공통 context는 시작 노드에서 만드는 편이 명확했다.

**Memory는 증거가 아니라 방향이다.** 이전 record는 다음 실행을 빠르게 시작하게 하지만, 중요한 claim은 다시 확인해야 한다.

**압축된 context가 raw record보다 낫다.** agent가 필요한 것은 모든 필드가 아니라 "지금 작업에 어떤 기억이 유용한가"다.

## 다음

지금 검색은 단순하다. query token과 record text가 겹치면 점수를 준다. 하지만 memory가 늘어나면 이 방식은 금방 한계가 온다.

다음은 ranking이다. 관련도, recency, record type, trust를 함께 보고 어떤 memory를 위로 올릴지 정해야 한다.

*To be continued.*
