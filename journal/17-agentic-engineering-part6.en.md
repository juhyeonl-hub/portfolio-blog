---
title: "Agentic Engineering with Memory (Part 6)"
excerpt: "Splitting LangGraph checkpoint state from durable research memory, and why an agent needs both to become a system."
tags: [Dev, AI, Agentic]
---

Part 5 gave the research agent a quality loop. The graph could research, analyze, write, review, and revise. That made one run more reliable.

But one run is still one run. When the process ends, the useful things disappear with it: source notes, reviewer decisions, the final answer, and why the graph revised. A real research agent needs to carry some knowledge forward.

So Part 6 is about **memory**.

![Memory layers in a LangGraph research agent](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/17_memory_layers.svg)

The important lesson was that memory is not one thing. I ended up separating it into two layers:

```text
short-term graph state    -> messages, routing, review status, revision count
durable research memory   -> notes, sources, review decisions, draft answers
```

The first layer helps the graph continue an active run. The second layer helps a future run start with useful context from the past.

## Why messages are not enough

The previous state looked like this:

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str
    review_status: str
    revision_count: int
```

That is enough for the graph to decide what happens next. It knows whether the reviewer said `PASS` or `REVISE`, and whether the revision limit has been reached.

But it is not enough for a system that should learn across runs. Message history is noisy. It contains routing logs, worker outputs, tool chatter, drafts, and review comments all mixed together. If I simply dump the whole message list into the next run, I am not giving the agent memory. I am giving it a pile.

So I added explicit durable records:

```python
memory.append(run_id, "research_note", {...})
memory.append(run_id, "source_record", {...})
memory.append(run_id, "analysis_note", {...})
memory.append(run_id, "draft_answer", {...})
memory.append(run_id, "review_decision", {...})
```

This is small, but it changes the design. The graph no longer treats every message as equally valuable. It chooses what deserves to survive.

## The memory store

For this step I used a tiny JSONL store:

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

This is not a production memory system. It has no embeddings, no database index, and no serious retrieval model. That is fine for this part. The point was to make the persistence boundary visible.

Every record has:

```text
id          unique memory record id
run_id      which graph run created it
kind        research_note, source_record, review_decision, ...
created_at  when it was saved
payload     the actual content
```

That structure is already better than dumping a transcript into a file. A source record is not the same thing as a reviewer decision. A draft answer is not the same thing as an analysis note. Once the records have types, the system can make policy around them.

## Loading memory at the start

I added a `memory_loader` node before the supervisor:

```python
graph_builder.add_edge(START, "memory_loader")
graph_builder.add_edge("memory_loader", "supervisor")
```

That node looks at the user's question, searches prior records, and injects a compact summary into the message list:

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

This means the first worker does not start from an empty room anymore. It can see what the system already knows.

There is one important rule in the researcher prompt:

```text
Use durable memory only as context, never as proof by itself.
```

That rule matters. Memory can be stale, incomplete, or wrong. For research tasks, durable memory should help the agent know where to look and what it previously concluded. It should not replace fresh evidence.

## Checkpoints are different

I also attached LangGraph's in-memory checkpointer:

```python
checkpointer = MemorySaver()
graph = graph_builder.compile(checkpointer=checkpointer)
```

This is a different kind of memory. A checkpoint is execution state. It is about resuming or inspecting a specific graph thread. The durable JSONL file is knowledge state. It is about what future runs should be able to reuse.

That distinction feels small until it breaks.

If I lose checkpoint state, I may need to restart the current run. Annoying, but bounded.

If I lose durable research memory, the system forgets what it learned across runs. The agent remains a workflow, not a system.

## What gets saved

Each worker now leaves a record behind.

The researcher saves notes and any URLs it mentions:

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

The analyst saves structured interpretation. The writer saves a draft answer. The reviewer saves the decision and revision count.

That last one is surprisingly useful:

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

Now the system can later answer questions like:

```text
What did the reviewer reject last time?
Which source was used for this topic?
Did the answer pass on the first attempt?
What changed after revision?
```

That is the beginning of observability across runs.

## What I am taking away

**Memory is a design boundary, not a bigger prompt.** The question is not "how much history can I stuff into context?" The question is "which facts deserve to survive, and in what shape?"

**Checkpoint state and durable memory are different tools.** Checkpoints preserve an active graph thread. Durable memory preserves reusable knowledge.

**Typed records beat raw transcripts.** A `source_record` and a `review_decision` need different policies. Once they are separate records, the system can treat them differently.

**Memory should support research, not replace it.** Prior notes can guide the next run, but important claims still need fresh sources.

## Next

The agent now has specialists, a supervisor, a quality loop, and a small durable memory layer.

The next problem is retrieval quality. Keyword matching is enough to show the idea, but it will not scale. Part 7 should move from "save records" to "retrieve the right records": embeddings, similarity search, memory ranking, and rules for when old memory should be ignored.

*To be continued.*
