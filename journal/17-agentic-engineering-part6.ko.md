---
title: "메모리 기반 에이전틱 엔지니어링 (Part 6)"
excerpt: "LangGraph checkpoint state와 오래 남는 research memory를 분리하면서, agent workflow가 system으로 넘어가는 지점을 정리한 기록."
tags: [Dev, AI, Agentic]
---

Part 5에서는 research agent에 quality loop를 붙였다. 그래프는 research, analysis, writing, review, revision을 할 수 있게 됐다. 한 번의 실행은 훨씬 안정적이 됐다.

하지만 한 번의 실행은 여전히 한 번의 실행일 뿐이다. 프로세스가 끝나면 유용한 것들도 같이 사라진다. source note, reviewer decision, final answer, 왜 revision이 일어났는지 같은 정보들 말이다. 실제 research agent라면 어떤 지식은 다음 실행으로 가져갈 수 있어야 한다.

그래서 Part 6의 주제는 **memory**다.

![LangGraph research agent의 memory layers](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/17_memory_layers.svg)

가장 중요한 배움은 memory가 하나가 아니라는 점이었다. 이번에는 두 레이어로 나눴다.

```text
short-term graph state    -> messages, routing, review status, revision count
durable research memory   -> notes, sources, review decisions, draft answers
```

첫 번째 레이어는 현재 실행 중인 graph thread를 이어가기 위한 기억이다. 두 번째 레이어는 미래의 실행이 과거의 유용한 context를 다시 쓸 수 있게 해주는 기억이다.

## messages만으로는 부족하다

이전 state는 이렇게 생겼다.

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str
    review_status: str
    revision_count: int
```

이 정도면 그래프가 다음 단계를 결정하기에는 충분하다. reviewer가 `PASS`를 냈는지 `REVISE`를 냈는지, revision limit에 도달했는지 알 수 있다.

하지만 여러 실행 사이에서 배워야 하는 시스템에는 부족하다. message history는 시끄럽다. routing log, worker output, tool chatter, draft, review comment가 전부 섞여 있다. 그 전체를 다음 실행에 그대로 넣는 건 memory를 주는 게 아니다. 그냥 더미를 넘기는 것이다.

그래서 오래 남길 record를 명시적으로 분리했다.

```python
memory.append(run_id, "research_note", {...})
memory.append(run_id, "source_record", {...})
memory.append(run_id, "analysis_note", {...})
memory.append(run_id, "draft_answer", {...})
memory.append(run_id, "review_decision", {...})
```

작은 변화지만 설계가 달라진다. 이제 그래프는 모든 메시지를 같은 가치로 보지 않는다. 무엇이 살아남아야 하는지 선택한다.

## memory store

이번 단계에서는 작은 JSONL store를 썼다.

```python
class LongTermMemory:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.records_path = root / "research_memory.jsonl"
        self.root.mkdir(parents=True, exist_ok=True)

    def append(self, run_id: str, kind: str, payload: dict[str, Any]) -> None:
        record = {
            "id": str(uuid.uuid4()),
            "run_id": run_id,
            "kind": kind,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
```

production memory system은 아니다. embedding도 없고, database index도 없고, retrieval model도 단순하다. 그래도 이번 Part에서는 충분하다. 목적은 persistence boundary를 눈에 보이게 만드는 것이기 때문이다.

각 record는 이런 필드를 가진다.

```text
id          unique memory record id
run_id      which graph run created it
kind        research_note, source_record, review_decision, ...
created_at  when it was saved
payload     the actual content
```

이 구조만으로도 transcript 전체를 파일에 던져 넣는 것보다 낫다. source record와 reviewer decision은 같은 종류의 기억이 아니다. draft answer와 analysis note도 다르다. record에 type이 생기면, 시스템은 그 type을 기준으로 policy를 만들 수 있다.

## 시작할 때 memory 읽기

supervisor 앞에 `memory_loader` 노드를 추가했다.

```python
graph_builder.add_edge(START, "memory_loader")
graph_builder.add_edge("memory_loader", "supervisor")
```

이 노드는 사용자 질문을 보고 이전 record를 검색한 뒤, 압축된 context를 message list에 넣는다.

```python
def memory_loader_node(state: AgentState) -> dict:
    question = _first_human_question(state["messages"])
    memory_context = memory.format_context(question)

    return {
        "messages": [AIMessage(content=memory_context, name="memory")],
        "memory_context": memory_context,
        "run_id": state.get("run_id") or str(uuid.uuid4()),
    }
```

이제 첫 worker는 빈 방에서 시작하지 않는다. 시스템이 이미 알고 있는 것을 보고 출발할 수 있다.

단, researcher prompt에는 중요한 규칙을 넣었다.

```text
Use durable memory only as context, never as proof by itself.
```

이 규칙은 중요하다. memory는 오래됐을 수 있고, 불완전할 수 있고, 틀렸을 수도 있다. research task에서 durable memory는 어디를 봐야 하는지, 예전에 어떤 결론을 냈는지 알려주는 context여야 한다. fresh evidence를 대체하면 안 된다.

## checkpoint는 다른 memory다

LangGraph의 in-memory checkpointer도 붙였다.

```python
checkpointer = MemorySaver()
graph = graph_builder.compile(checkpointer=checkpointer)
```

이건 다른 종류의 memory다. checkpoint는 execution state다. 특정 graph thread를 resume하거나 inspect하기 위한 것이다. JSONL 파일은 knowledge state다. 다음 실행들이 재사용할 수 있는 지식을 남기는 것이다.

작은 차이처럼 보이지만, 시스템이 커지면 이 차이가 중요해진다.

checkpoint state를 잃으면 현재 실행을 다시 시작하면 된다. 귀찮지만 범위가 제한돼 있다.

durable research memory를 잃으면 시스템은 여러 실행 사이에서 배운 것을 잊는다. agent는 여전히 workflow에 머물고, system이 되지 못한다.

## 무엇을 저장할 것인가

이제 각 worker는 record를 남긴다.

researcher는 note와 URL을 저장한다.

```python
memory.append(
    state["run_id"],
    "research_note",
    {
        "question": _first_human_question(state["messages"]),
        "summary": _compact(content),
    },
)
```

analyst는 구조화된 해석을 저장한다. writer는 draft answer를 저장한다. reviewer는 decision과 revision count를 저장한다.

의외로 마지막 것이 유용하다.

```python
memory.append(
    state["run_id"],
    "review_decision",
    {
        "status": status,
        "revision_count": next_revision_count,
        "decision": review,
    },
)
```

이제 시스템은 나중에 이런 질문에 답할 수 있다.

```text
지난번 reviewer는 무엇을 거절했나?
이 주제에서 어떤 source를 썼나?
첫 시도에서 통과했나?
revision 이후 무엇이 바뀌었나?
```

여기서부터 여러 실행을 관통하는 observability가 생기기 시작한다.

## 가져갈 것

**Memory는 더 큰 prompt가 아니라 설계 경계다.** 핵심 질문은 "얼마나 많은 history를 context에 넣을 수 있는가?"가 아니다. "어떤 사실을 어떤 모양으로 남길 것인가?"다.

**Checkpoint state와 durable memory는 다른 도구다.** checkpoint는 실행 중인 graph thread를 보존한다. durable memory는 재사용 가능한 지식을 보존한다.

**Raw transcript보다 typed record가 낫다.** `source_record`와 `review_decision`에는 서로 다른 policy가 필요하다. record가 분리되어 있으면 시스템도 다르게 다룰 수 있다.

**Memory는 research를 도와야지 대체하면 안 된다.** 이전 note는 다음 실행을 안내할 수 있지만, 중요한 claim은 여전히 fresh source가 필요하다.

## 다음

이제 agent에는 specialist, supervisor, quality loop, 작은 durable memory layer가 있다.

다음 문제는 retrieval quality다. keyword matching만으로도 아이디어를 보여주기에는 충분하지만, 확장하기에는 부족하다. Part 7은 "record를 저장한다"에서 "맞는 record를 찾는다"로 넘어가면 좋겠다. embedding, similarity search, memory ranking, 그리고 오래된 memory를 무시해야 하는 규칙이 다음 주제가 될 수 있다.

*To be continued.*
