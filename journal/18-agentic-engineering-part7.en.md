---
title: "Agentic Engineering with Retrieval (Day 8 / Part 7)"
excerpt: "Turning durable memory into reusable context by adding a retrieval step before the agent graph starts reasoning."
date: 2026-05-15
tags: [Dev, AI, Agentic]
---

Part 6 gave the agent durable memory. The researcher, analyst, writer, and reviewer could leave typed records in a JSONL store.

But saving memory is only half the problem. Day 8 is about **retrieval**.

![Memory retrieval flow](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/18_memory_retrieval.svg)

Memory that cannot be retrieved is just a log. Memory that is retrieved too broadly becomes noise. So the core question was:

```text
When a new question arrives, which memory records should enter the context?
```

## From store to retriever

The previous memory store was append-first:

```python
memory.append(run_id, "research_note", {...})
memory.append(run_id, "source_record", {...})
memory.append(run_id, "review_decision", {...})
```

Today I added a small `search()` method:

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

It is intentionally simple. For now, the score is based on token overlap between the query and the record payload. Still, this changes the shape of the system. Memory is no longer just a file. It becomes a component that runs before reasoning starts.

## The memory loader owns retrieval

I did not put retrieval inside each worker. I kept it in a `memory_loader` node before the supervisor:

```python
graph_builder.add_edge(START, "memory_loader")
graph_builder.add_edge("memory_loader", "supervisor")
```

That feels like the right boundary. If every worker retrieves memory independently, the system starts from different assumptions in different places. A shared loader gives the graph one stable starting context.

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

## Memory is not evidence

Once retrieval worked, a risky pattern appeared: the agent was willing to treat prior memory as fact.

So the researcher prompt gained a rule:

```text
Durable memory is context. It can suggest where to look.
It is not evidence. Verify important claims with fresh sources.
```

That rule matters more as memory grows. Old records can speed up a new run, but they should not replace fresh evidence.

## Context should be small

At first I injected full records into the message list. That produced too much formatting noise: ids, run ids, timestamps, and nested payloads.

So I compressed memory into short notes:

```text
Relevant memory:
- [research_note] Previous run found that checkpoint state and durable memory solve different problems.
- [review_decision] Reviewer asked for a clearer separation between memory as context and memory as evidence.
```

The agent does not need a database dump. It needs useful hints for the current task.

## What I am taking away

**Retrieval is policy, not just search.** The number of records, the score, and the formatting all change how the agent behaves.

**The graph should own shared memory context.** A common loader gives every worker the same starting point.

**Memory is direction, not proof.** Prior records help the next run start faster, but important claims still need verification.

**Compressed context beats raw records.** The agent needs the useful part, not every stored field.

## Next

The current search is basic. It works for a small JSONL file, but it will not scale.

Next comes ranking: relevance, recency, record type, and trust all need to influence which memories reach the prompt.

*To be continued.*
