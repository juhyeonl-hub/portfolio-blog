---
title: "Agentic Engineering with Quality Loops (Part 5)"
excerpt: "Adding a reviewer after the writer, then learning why quality gates need explicit routing policy, robust parsing, and retry limits."
tags: [Dev, AI, Agentic]
---

Part 4 ended with a small problem: the hand-built supervisor was free to skip steps. For a light question, it called `researcher` once and finished. Efficient, yes. But if the product requirement is *"every answer must be analyzed, written, and reviewed,"* then efficiency is not the goal. Control is.

So Part 5 adds a **quality loop**.

![Quality loop in a LangGraph supervisor system](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/16_quality_loop.svg)

The new worker is `reviewer`. After the writer produces an answer, the reviewer returns one of two labels:

```text
PASS: the answer is good enough
REVISE: here is what needs to improve
```

If the result is `PASS`, the graph ends. If it is `REVISE`, the work loops back through researcher, analyst, and writer. I also added `MAX_REVISIONS = 2`, because a quality loop without an escape hatch is just a polite infinite loop.

## What changed in state

Part 4's state only needed messages and the supervisor's next decision:

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str
```

Part 5 adds review state:

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str
    review_status: str
    revision_count: int
```

That small addition changes the shape of the system. The graph can now remember not only *what was said*, but also *whether the output passed quality control* and *how many times the system has tried to fix it*.

This is the same thing I keep seeing in systems work: once state exists, policy can exist. Without state, everything becomes prompt vibes.

## The reviewer node

The reviewer is deliberately strict. It does not rewrite the answer. It only judges it.

```python
reviewer_agent = create_react_agent(
    model=model,
    tools=[],
    prompt=(
        "You are a strict reviewer. Review the writer's latest answer.\n"
        "Return exactly one of these formats:\n"
        "PASS: <one-sentence reason>\n"
        "REVISE: <specific feedback for what to improve>"
    ),
)
```

The graph then parses that label:

```python
review = str(last_msg.content).strip()
review_upper = review.upper()
pass_index = review_upper.find("PASS:")
revise_index = review_upper.find("REVISE:")

status = "PASS" if pass_index != -1 and (
    revise_index == -1 or pass_index < revise_index
) else "REVISE"
```

I started with the naive version:

```python
status = "PASS" if review.upper().startswith("PASS") else "REVISE"
```

And it broke immediately. The reviewer returned `PASS`, but the message had extra routing text before it, so the parser saw something that did not start with `PASS` and treated it as `REVISE`. The graph went back into the loop even though the answer had passed.

That was the useful bug. When an LLM output becomes a control signal, parsing is no longer a formatting detail. It is part of the system's correctness.

## Policy before autonomy

The first run exposed another problem. Even after adding a reviewer, the supervisor still tried to finish too early. It saw a decent researcher answer and chose `FINISH` before analyst, writer, or reviewer ever ran.

So I stopped treating the supervisor as the source of truth. The graph now enforces the minimum workflow before it asks the LLM to improvise:

```python
if researcher_index == -1:
    next_node = "researcher"
elif analyst_index < researcher_index:
    next_node = "analyst"
elif writer_index < analyst_index:
    next_node = "writer"
else:
    # only now ask the supervisor model
```

This is the core lesson of Part 5: **the model can choose inside the boundaries, but the graph should define the boundaries.**

The supervisor is useful for flexible decisions. It is not the right place to store non-negotiable product requirements. If every report must be reviewed, make review an edge in the graph. Do not hope the supervisor remembers.

## The real run

After fixing the route policy and parser, the trace became the shape I wanted:

```text
supervisor -> researcher
supervisor -> analyst
supervisor -> writer
writer -> reviewer
reviewer -> PASS
END
```

The final reviewer output was:

```text
PASS: The answer directly defines LangGraph in one clear paragraph...
```

That is a small example, but the structure matters. In a real system the reviewer could check source coverage, tone, hallucination risk, missing citations, policy constraints, or whether the answer satisfies a rubric. The important part is not that the reviewer is perfect. It is that the system has a place where quality is checked explicitly.

## What I am taking away

**Quality is a loop, not a prompt adjective.** Saying "write a high-quality answer" is weaker than adding a reviewer node that can reject the answer.

**Control signals need engineering.** `PASS` and `REVISE` look simple, but the parser, retry count, and fallback behavior decide whether the loop is safe.

**Graph policy beats model memory.** If a step must always happen, encode it in routing. Prompts are good for judgment; graphs are better for guarantees.

**Worker inputs need task framing.** When I removed supervisor routing messages from worker context, some agents produced empty outputs. The fix was to append a clear `HumanMessage` at each node: research this, analyze this, write this, review this. An agent node should know not only the history, but also the current job.

## Next

The system now has specialists, a supervisor, and a quality gate. The next problem is **memory**: what should persist between runs, and what should be thrown away?

Short-term message history is enough for a toy graph. A real research agent needs durable notes, source records, previous decisions, and maybe a way to resume after interruption. That pushes the project from "agent workflow" toward "agentic system."

That is where Part 6 should go.

*To be continued.*
