---
title: "Agentic Engineering with Verification (Part 9)"
excerpt: "Checking retrieved memory against fresh evidence so the agent does not reuse stale conclusions as facts."
date: 2026-05-19
tags: [Dev, AI, Agentic]
---

Part 8 added ranking. The agent could prioritize memory by relevance, recency, and record type.

But ranking is not enough. A selected memory can still be stale or wrong.

Part 9 is about **verification**.

![Memory verification loop](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/20_memory_verification.svg)

Memory can make a system faster. It can also trap the system in old conclusions. If the agent does not check whether prior knowledge is still true, it will confidently reuse yesterday's answer.

## A node that distrusts memory

I started thinking about a `memory_verifier` node. Its job is narrow:

```text
look at retrieved memory,
extract claims that matter for the current question,
mark which claims need fresh evidence.
```

I could have pushed this responsibility into the researcher prompt. But that makes the researcher do too much: retrieve, research, verify, and plan the answer.

So verification becomes its own step:

```python
graph_builder.add_edge("memory_loader", "memory_verifier")
graph_builder.add_edge("memory_verifier", "supervisor")
```

That boundary feels cleaner. Before the supervisor routes work, the graph already knows which memory is usable and which memory should be checked.

## The stale flag

The simplest signal is age:

```python
def is_stale(record: MemoryRecord, now: datetime) -> bool:
    if record.kind == "source_record":
        return age_days(record, now) > 14
    if record.kind == "draft_answer":
        return True
    return age_days(record, now) > 45
```

Different record types need different rules. A source record depends on the outside world, so it can become stale quickly. A draft answer is never strong evidence. An analysis note may survive longer.

This rule is not perfect, but it is much better than trusting every memory equally.

## Verifier output

The verifier does not write the answer. It produces a small control note:

```text
Memory verification:
- usable: prior distinction between checkpoint state and durable memory
- verify: claim about current LangGraph persistence APIs
- ignore: old draft answer that was never reviewed
```

That note helps the researcher. It starts with a map of what can be reused and what needs checking.

## Connecting to fresh evidence

The verifier does not delete memory. It tells the worker how to treat it:

```text
Use usable memory as background.
For verify items, search or inspect source before using them.
Ignore rejected or stale draft records unless explicitly needed.
```

Memory now has three states:

```text
usable   safe as context
verify   useful direction, but needs evidence
ignore   not used in this run
```

That makes memory context less dangerous. The agent can see the past without blindly believing it.

## Review decisions are valuable

`review_decision` records became surprisingly useful. If a reviewer rejected a previous answer for treating memory as proof, that failure should shape the next run.

```text
review_decision:
REVISE: The answer treats durable memory as proof.
```

That kind of record can stay useful longer than an API note. Source freshness and process learning have different lifetimes.

## What I am taking away

**Retrieval needs doubt.** Finding memory and trusting memory are different operations.

**Verification can be a system step.** Keeping it as a node makes the responsibility explicit.

**Staleness depends on record type.** Source records age differently from review decisions.

**A good memory system knows how to ignore.** Carrying every memory forward does not make the agent smarter. It makes the context heavier.

## Next

Memory can now be saved, retrieved, ranked, and verified.

The next problem is observability: seeing which memories were used, ignored, or changed the next run.

Part 10 treats memory as an audit trail.

*To be continued.*
