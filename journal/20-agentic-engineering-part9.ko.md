---
title: "검증 기반 에이전틱 엔지니어링 (Part 9)"
excerpt: "retrieved memory를 fresh evidence와 대조하면서, 오래된 기억을 그대로 믿지 않는 agent workflow를 만든 기록."
date: 2026-05-19
tags: [Dev, AI, Agentic]
---

Part 8에서는 memory ranking을 붙였다. 이제 agent는 관련도, 최신성, record type을 보고 memory를 고를 수 있다.

하지만 좋은 ranking도 마지막 답은 아니다. 선택된 memory가 여전히 맞는지 확인해야 한다.

오늘의 주제는 **verification**이다.

![Memory verification loop](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/20_memory_verification.svg)

memory는 system을 빠르게 만든다. 동시에 system을 과거에 묶어둘 수도 있다. 예전에는 맞았던 정보가 지금도 맞는지 확인하지 않으면, agent는 오래된 확신을 재사용하게 된다.

## memory를 의심하는 노드

오늘은 `memory_verifier`를 독립 노드로 생각했다. 역할은 간단하다.

```text
retrieved memory를 보고,
현재 질문에 중요한 claim을 뽑고,
fresh evidence가 필요한 claim을 표시한다.
```

처음에는 researcher에게 이 일을 맡기려고 했다. 하지만 그러면 researcher prompt가 너무 많은 책임을 갖게 된다. 검색하고, 연구하고, 검증하고, 답변 방향까지 잡아야 한다.

그래서 verification을 별도 단계로 분리했다.

```python
graph_builder.add_edge("memory_loader", "memory_verifier")
graph_builder.add_edge("memory_verifier", "supervisor")
```

이 흐름이 마음에 드는 이유는 명확하다. memory는 supervisor가 worker를 고르기 전에 이미 정리되고, 의심할 부분도 표시된다.

## stale flag

가장 단순한 신호는 나이다.

```python
def is_stale(record: MemoryRecord, now: datetime) -> bool:
    if record.kind == "source_record":
        return age_days(record, now) > 14
    if record.kind == "draft_answer":
        return True
    return age_days(record, now) > 45
```

record type마다 기준이 다르다. source record는 외부 세계에 의존하므로 빨리 낡는다. draft answer는 애초에 검증된 record가 아니므로 항상 조심한다. analysis note는 조금 더 오래 쓸 수 있다.

이 규칙은 완벽하지 않다. 하지만 "모든 memory를 같은 방식으로 믿는다"보다 훨씬 낫다.

## verifier output

verifier는 답을 쓰지 않는다. 작은 control note를 만든다.

```text
Memory verification:
- usable: prior distinction between checkpoint state and durable memory
- verify: claim about current LangGraph persistence APIs
- ignore: old draft answer that was never reviewed
```

이 note를 worker context에 넣으면 researcher가 더 잘 움직인다. 어디를 다시 확인해야 하는지 알고 시작하기 때문이다.

## fresh evidence와 연결하기

중요한 건 verifier가 memory를 삭제하지 않는다는 점이다. 대신 worker에게 태도를 알려준다.

```text
Use usable memory as background.
For verify items, search or inspect source before using them.
Ignore rejected or stale draft records unless explicitly needed.
```

이제 memory는 세 가지 상태를 갖는다.

```text
usable   지금 context로 사용 가능
verify   방향으로는 유용하지만 근거 확인 필요
ignore   이번 실행에서는 쓰지 않음
```

이 분류가 생기자 memory context가 훨씬 덜 위험해졌다. agent는 과거 record를 보지만, 그대로 믿지는 않는다.

## review decision의 가치

의외로 `review_decision`이 verification에서 중요했다. 예전 reviewer가 어떤 답변을 거절했는지 알면, 같은 실수를 피할 수 있다.

```text
review_decision:
REVISE: The answer treats durable memory as proof.
```

이 record는 오래되어도 가치가 있다. API 정보처럼 낡는 지식이 아니라, 시스템이 한 번 실패한 패턴에 대한 기록이기 때문이다.

그래서 trust를 다르게 봐야 한다. source freshness와 process learning은 수명이 다르다.

## 가져갈 것

**Retrieval 뒤에는 의심이 필요하다.** memory를 찾는 것과 memory를 믿는 것은 다른 일이다.

**Verification은 worker prompt의 부가 문장이 아니라 시스템 단계가 될 수 있다.** 별도 노드로 두면 책임이 선명해진다.

**Staleness는 record type마다 다르다.** source는 빨리 낡고, review decision은 더 오래 남을 수 있다.

**좋은 memory system은 잊는 법도 알아야 한다.** 모든 기억을 들고 가는 agent는 똑똑해지는 게 아니라 무거워진다.

## 다음

이제 memory는 저장되고, 검색되고, 정렬되고, 검증된다.

다음 문제는 observability다. 여러 run을 지나면서 어떤 memory가 사용됐고, 어떤 memory가 무시됐고, 어떤 review가 다음 실행을 바꿨는지 볼 수 있어야 한다.

Part 10은 memory를 audit trail로 보는 단계다.

*To be continued.*
