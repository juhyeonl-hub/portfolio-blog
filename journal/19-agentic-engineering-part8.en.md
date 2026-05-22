---
title: "Agentic Engineering with Ranking (Part 8)"
excerpt: "Adding scoring to memory retrieval so the agent can prioritize relevant, recent, and trustworthy records."
date: 2026-05-17
tags: [Dev, AI, Agentic]
---

Day 8 made memory reusable. The `memory_loader` searched prior records and injected a compact context before the graph started.

Today was about the next problem: once there are many records, retrieval is not enough. The system needs to decide **which memories deserve priority**.

![Memory ranking](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/19_memory_ranking.svg)

Search creates candidates. Ranking turns those candidates into policy.

## Why scoring matters

The first retriever used simple token overlap. That worked for a tiny store, but the weakness showed up quickly:

```text
source_record     accurate but old
research_note     relevant but lossy
review_decision   recent but weakly related
draft_answer      fluent but unverified
```

Those records should not be treated the same way. A draft can be useful context, but it is not the same as a verified source record.

## A simple scoring model

I used four signals:

```python
score = (
    relevance * 0.55
    + recency * 0.20
    + type_weight * 0.15
    + trust * 0.10
)
```

This is not sophisticated, but the separation matters.

`relevance` checks how closely the record matches the question. `recency` gently lowers old records. `type_weight` lets source and review records outrank drafts. `trust` leaves space for future human-approved or verified memories.

## Record type is policy

The `kind` field started to earn its place today.

Part 6 saved records like this:

```python
"research_note"
"source_record"
"analysis_note"
"draft_answer"
"review_decision"
```

At first, that looked like organization. With ranking, it becomes a policy input:

```python
TYPE_WEIGHT = {
    "source_record": 0.95,
    "review_decision": 0.80,
    "analysis_note": 0.70,
    "research_note": 0.65,
    "draft_answer": 0.45,
}
```

Two records can contain the same keyword but deserve different treatment. Typed memory makes that possible.

## How old is too old?

Recency is subtle. Old does not always mean bad. A design principle can stay useful for years. An API detail or pricing note can become stale quickly.

So I did not make recency a hard rule. I made it one signal:

```python
age_days = max(0, (now - created_at).days)
recency = 1 / (1 + age_days / 30)
```

After a month, the score declines. But if relevance and type weight are high enough, the record can still be selected.

## Keep top K small

At first I assumed more memory would help. It did not. Top 10 gave the agent too many directions. Top 3 or top 5 worked better.

Good memory context should be clear, not large.

```text
Use at most five memory records.
Prefer records that are relevant, recent, and typed as source/review/analysis.
Do not include low-confidence drafts unless no better context exists.
```

The output became steadier once the memory context became smaller.

## What I am taking away

**Search results need ordering before they become system input.** Otherwise the agent is pulled toward whatever appears first.

**Record type is not just metadata.** Source, review, and draft records carry different trust levels.

**Recency is a signal, not a law.** Old memory should be questioned, but not always discarded.

**Smaller top K can be stronger.** The goal is not to fill context. The goal is to provide useful cues.

## Next

Ranking helps select memory, but it does not prove that memory is still true.

Day 10 is about verification: checking old memory against fresh evidence before the agent relies on it.

*To be continued.*
