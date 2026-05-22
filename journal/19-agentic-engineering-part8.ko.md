---
title: "랭킹 기반 에이전틱 엔지니어링 (Part 8)"
excerpt: "memory retrieval에 점수와 우선순위를 붙이면서, 오래된 기록과 중요한 기록을 다르게 다루는 방법을 정리한 기록."
date: 2026-05-17
tags: [Dev, AI, Agentic]
---

Part 7에서는 memory를 다시 꺼내 쓰기 시작했다. `memory_loader`가 질문을 보고 관련 record를 찾아 worker context에 넣었다.

오늘은 그 다음 문제다. record가 많아지면 "찾았다"만으로는 부족하다. **무엇을 먼저 믿고, 무엇을 뒤로 밀 것인가**를 정해야 한다.

![Memory ranking](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/19_memory_ranking.svg)

검색은 후보를 만든다. ranking은 시스템의 판단을 만든다.

## 점수가 필요한 이유

처음 retrieval은 단순했다. query 단어와 record text가 겹치면 결과에 넣었다. 작은 예제에서는 괜찮았다. 하지만 record가 조금만 늘어나도 문제가 보였다.

```text
source_record     정확하지만 오래됨
research_note     관련 있지만 요약이 부정확함
review_decision   최신이지만 현재 질문과 약함
draft_answer      길고 그럴듯하지만 검증되지 않음
```

이 record들을 같은 기준으로 다룰 수는 없다. 특히 `draft_answer`는 조심해야 한다. 초안은 유용한 context일 수 있지만, 그 자체가 검증된 사실은 아니다.

## 간단한 scoring model

오늘은 네 가지 신호를 사용했다.

```python
score = (
    relevance * 0.55
    + recency * 0.20
    + type_weight * 0.15
    + trust * 0.10
)
```

정교한 모델은 아니다. 하지만 각 항목이 분리되어 있다는 점이 중요하다.

`relevance`는 질문과 record가 얼마나 겹치는지 본다. `recency`는 오래된 memory를 조금씩 아래로 내린다. `type_weight`는 source와 review 같은 record를 draft보다 위에 둘 수 있게 한다. `trust`는 나중에 사람이 승인한 memory나 검증된 source를 올리기 위한 자리다.

## record type은 policy다

이번 단계에서 가장 마음에 들었던 건 `kind` 필드가 실제로 쓸모를 갖기 시작했다는 점이다.

Part 6에서 record를 저장할 때 이렇게 나눴다.

```python
"research_note"
"source_record"
"analysis_note"
"draft_answer"
"review_decision"
```

당시에는 정리용 필드처럼 보였다. 그런데 ranking이 들어오자 이 필드는 policy input이 됐다.

```python
TYPE_WEIGHT = {
    "source_record": 0.95,
    "review_decision": 0.80,
    "analysis_note": 0.70,
    "research_note": 0.65,
    "draft_answer": 0.45,
}
```

같은 단어가 들어 있어도 source record와 draft answer는 다르게 다뤄야 한다. typed memory를 만든 이유가 여기서 보였다.

## 오래된 memory를 어떻게 볼 것인가

recency는 생각보다 애매했다. 오래됐다고 무조건 나쁜 건 아니다. 시스템 설계 원칙 같은 건 오래돼도 유효할 수 있다. 반대로 API 사용법이나 가격, 정책은 금방 낡는다.

그래서 recency를 절대 규칙으로 두지 않았다. 점수의 일부로만 썼다.

```python
age_days = max(0, (now - created_at).days)
recency = 1 / (1 + age_days / 30)
```

한 달이 지나면 점수가 내려가지만, relevance와 type weight가 높으면 여전히 선택될 수 있다. 이 정도의 부드러운 감쇠가 지금 단계에는 맞았다.

## top K는 작게

처음에는 많이 넣을수록 좋다고 생각했다. 아니었다. top 10을 넣으면 worker가 너무 많은 방향을 동시에 본다. top 3이나 top 5가 더 안정적이었다.

좋은 memory context는 풍부해야 하는 게 아니라 **선명해야 한다**.

```text
Use at most five memory records.
Prefer records that are relevant, recent, and typed as source/review/analysis.
Do not include low-confidence drafts unless no better context exists.
```

이 규칙을 넣으니 worker 출력이 덜 흔들렸다.

## 가져갈 것

**검색 결과는 정렬되어야 시스템 입력이 된다.** 후보 목록만 있으면 agent는 우연히 앞에 온 record에 끌린다.

**record type은 단순 메타데이터가 아니다.** source, review, draft는 서로 다른 신뢰도를 가진다. kind가 있어야 policy를 만들 수 있다.

**recency는 규칙보다 신호에 가깝다.** 오래된 기억은 의심해야 하지만, 항상 버려야 하는 것은 아니다.

**top K는 작을수록 강해질 때가 많다.** context window를 채우는 것보다 agent가 실제로 사용할 수 있는 단서를 주는 게 중요하다.

## 다음

ranking은 memory를 더 똑똑하게 골라준다. 하지만 여전히 문제가 남아 있다. 선택된 memory가 맞는지 어떻게 확인할 것인가?

Part 9는 verification이다. 오래된 memory를 fresh evidence와 대조하고, 틀리거나 낡은 record를 사용하지 않는 규칙을 만들 차례다.

*To be continued.*
