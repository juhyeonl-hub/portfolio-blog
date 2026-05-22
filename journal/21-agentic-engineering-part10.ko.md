---
title: "관찰 가능성 기반 에이전틱 엔지니어링 (Part 10)"
excerpt: "memory record를 audit trail로 다루면서, agent가 무엇을 기억했고 무엇을 무시했는지 추적하는 방법을 정리한 기록."
date: 2026-05-21
tags: [Dev, AI, Agentic]
---

Day 10에서는 retrieved memory를 검증했다. 이제 agent는 오래된 record를 그대로 믿지 않고, usable / verify / ignore로 나눌 수 있다.

오늘은 memory를 다른 각도에서 봤다. memory는 agent를 똑똑하게 만드는 context이기도 하지만, 동시에 **audit trail**이다.

![Memory observability](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/21_memory_observability.svg)

agent가 어떤 답을 냈는지보다 더 중요한 질문이 있다.

```text
그 답을 만들 때 무엇을 기억했고, 무엇을 무시했고, 무엇을 다시 확인했는가?
```

## 실행 사이의 흔적

일반 로그는 한 실행을 설명한다. memory record는 여러 실행을 연결한다.

```text
run_01 -> source_record
run_02 -> retrieved source_record
run_02 -> review_decision
run_03 -> avoided previous failure
```

이 흐름이 보이면 agent system을 디버깅하는 방식이 달라진다. 단일 run의 trace만 보는 게 아니라, 시간이 지나면서 시스템이 어떤 패턴을 학습했는지 볼 수 있다.

## retrieval log

오늘 추가하고 싶었던 record는 `retrieval_event`다.

```python
memory.append(
    run_id,
    "retrieval_event",
    {
        "query": question,
        "selected_record_ids": [record.id for record in selected],
        "ignored_record_ids": [record.id for record in ignored],
        "reason": "ranked by relevance, recency, type, trust",
    },
)
```

이건 answer quality에 직접 들어가는 record는 아니다. 하지만 나중에 시스템을 이해하는 데 도움이 된다.

왜 이 답변이 이 방향으로 갔는지 추적하려면, 어떤 memory가 들어갔는지 알아야 한다.

## reviewer와 memory의 연결

reviewer는 결과만 평가하는 노드가 아니다. memory system에서는 reviewer가 미래 실행을 바꾸는 feedback source가 된다.

```python
memory.append(
    run_id,
    "review_decision",
    {
        "status": status,
        "decision": review,
        "used_memory_ids": used_memory_ids,
    },
)
```

이렇게 하면 다음 실행에서 이런 질문을 할 수 있다.

```text
어떤 memory를 썼을 때 reviewer가 REVISE를 냈나?
어떤 record는 반복적으로 좋은 답변에 기여했나?
어떤 source는 자주 ignore되는가?
```

이건 단순한 로깅이 아니다. memory quality를 평가하는 기반이다.

## 사람이 읽을 수 있어야 한다

JSONL은 편하다. 하지만 사람이 계속 읽기에는 어렵다. 그래서 `summarize_run()` 같은 작은 리포트 함수가 필요해졌다.

```text
Run summary
- Question: ...
- Retrieved: 5 records
- Used: 3 records
- Verified: 2 claims
- Ignored: 1 stale draft
- Review: PASS
```

이 리포트는 agent의 final answer보다 낮은 레이어에 있다. 사용자는 보지 않아도 된다. 하지만 개발자는 봐야 한다. agent system을 고칠 때 답변만 보면 원인을 놓친다.

## memory의 실패 모드

오늘 정리하면서 memory system의 실패 모드도 보였다.

```text
over-retrieval   너무 많은 기억을 넣어서 현재 질문이 흐려짐
stale reuse      오래된 정보를 새 사실처럼 사용함
draft leakage    검증되지 않은 초안이 근거처럼 섞임
review amnesia   이전 reviewer feedback을 다음 실행이 무시함
```

이 실패 모드들은 대부분 답변만 보면 늦게 발견된다. 그래서 observability가 필요하다. 어떤 memory가 들어갔는지, 왜 들어갔는지, reviewer가 어떻게 반응했는지 남겨야 한다.

## 가져갈 것

**Memory는 context이면서 trace다.** agent가 무엇을 재사용했는지 기록하지 않으면, 좋은 답변과 나쁜 답변의 차이를 설명하기 어렵다.

**Retrieval 자체도 기록해야 한다.** selected record뿐 아니라 ignored record도 디버깅에 가치가 있다.

**Reviewer feedback은 미래 실행의 데이터다.** review decision을 저장하면 quality loop가 한 run 안에서 끝나지 않는다.

**개발자용 리포트가 필요하다.** final answer는 사용자에게 충분할 수 있지만, 시스템을 개선하려면 run summary가 필요하다.

## 다음

Day 8부터 Day 11까지는 memory를 system으로 키우는 흐름이었다.

저장하고, 검색하고, 정렬하고, 검증하고, 추적했다. 이제 다음 단계는 이 memory layer를 실제 도구 사용과 연결하는 것이다. web search, local file inspection, source citation 같은 외부 행동이 memory와 만나면 agent는 더 실제적인 research system에 가까워진다.

다음은 tool-aware memory로 가면 좋겠다.

*To be continued.*
