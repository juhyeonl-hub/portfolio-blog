---
title: "Agentic Engineering with Observability (Day 11 / Part 10)"
excerpt: "Treating memory records as an audit trail so the agent can explain what it reused, ignored, and verified."
date: 2026-05-21
tags: [Dev, AI, Agentic]
---

Day 10 added verification. Retrieved memory is no longer blindly trusted. It can be marked usable, needs verification, or ignored.

Today I looked at memory from another angle. Memory is context, but it is also an **audit trail**.

![Memory observability](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/21_memory_observability.svg)

The important question is not only what answer the agent produced.

```text
What did it remember, ignore, and verify while producing that answer?
```

## Traces across runs

Normal logs explain one execution. Memory records connect many executions:

```text
run_01 -> source_record
run_02 -> retrieved source_record
run_02 -> review_decision
run_03 -> avoided previous failure
```

Once that chain is visible, debugging changes. I am no longer looking only at one run trace. I can see how the system behaves over time.

## Retrieval logs

The new record I wanted was `retrieval_event`:

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

This record does not directly improve the answer. It improves the ability to understand the system later.

If I want to know why an answer moved in a certain direction, I need to know which memories entered the context.

## Connecting reviewer feedback to memory

The reviewer is not just an output evaluator. In a memory system, it becomes a source of feedback for future runs.

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

Now future runs can ask:

```text
Which memories led to REVISE decisions?
Which records repeatedly helped good answers?
Which sources are often ignored?
```

That is the beginning of memory quality evaluation.

## Humans need readable summaries

JSONL is convenient, but it is not pleasant to inspect by hand. A small `summarize_run()` report becomes useful:

```text
Run summary
- Question: ...
- Retrieved: 5 records
- Used: 3 records
- Verified: 2 claims
- Ignored: 1 stale draft
- Review: PASS
```

This report sits below the final answer. Users may never see it, but developers need it. If I only inspect the answer, I miss the cause.

## Failure modes

The memory system now has visible failure modes:

```text
over-retrieval   too much past context blurs the current question
stale reuse      old information is treated as current fact
draft leakage    unverified drafts become evidence
review amnesia   prior reviewer feedback is ignored
```

Most of these are hard to diagnose from the final answer alone. Observability gives them names and records.

## What I am taking away

**Memory is both context and trace.** If the system does not record what it reused, it is hard to explain why an answer worked or failed.

**Retrieval should be logged.** Selected records matter, but ignored records can be just as useful for debugging.

**Reviewer feedback is future data.** A quality loop becomes more valuable when its decisions survive the run.

**Developer reports matter.** The final answer is for the user. The run summary is for improving the system.

## Next

Days 8 through 11 turned memory into a system layer.

The agent can now save, retrieve, rank, verify, and observe memory. The next step is connecting that memory layer to tool use: web search, local file inspection, and source citation.

Tool-aware memory feels like the right next direction.

*To be continued.*
