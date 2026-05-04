---
title: "Agentic Engineering with Orchestration (Part 4)"
excerpt: "Splitting one multi-tool agent into three specialists with a supervisor on top — and building the same thing twice, once with a library and once from scratch, to see what the abstraction was hiding."
tags: [Dev, AI, Agentic]
---

In Part 3 I extended a single agent's tool list to three. This time I split that single multi-tool agent into **three specialist agents** with a supervisor on top. I built the same thing two ways — once with a library, once by hand — and the comparison turned out to be the lesson.

## Why split a single agent

The agent through Part 3 did everything: search, analysis, and writing. For short questions it was fine, but giving one agent every role makes the system prompt sprawl — *"you're great at search and analysis and writing and..."* — and the model loses track of which mode it's in. The output tone wobbles, and when something goes wrong, "which step broke?" isn't a question you can easily answer.

The fix is **separation of concerns**. Instead of one all-purpose freelancer, hire three specialists.

- `researcher`: web search and content fetching only. Inherits the three tools from Part 3 (`web_search`, `get_current_date`, `fetch_url`).
- `analyst`: identifies patterns, contradictions, and source reliability in collected material. No tools, just reasoning.
- `writer`: takes the analysis and produces a markdown report. No tools.

Each system prompt is short and focused on one thing. Above them sits a `supervisor` deciding who to call.

## Two ways to build the same thing

I built the same system twice on purpose — once with a library (Version A), once by hand with `StateGraph` (Version B). They behave the same; what they teach is different.

![Supervisor pattern with two routing mechanisms](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/15_supervisor_pattern.svg)

### Version A — `create_supervisor()`

`langgraph-supervisor`'s `create_supervisor()` is a one-liner. Define your three agents, write a supervisor prompt, compile.

```python
supervisor = create_supervisor(
    agents=[researcher, analyst, writer],
    model=model,
    prompt="You are a supervisor managing three specialists: ...",
).compile()
```

The trace is clean:

```
supervisor → researcher → supervisor → analyst →
supervisor → writer → supervisor → FINISH
```

Every sub-agent returns control to the supervisor when it finishes, and the supervisor decides who's next. Looking inside the library, the routing mechanism is surprisingly mundane — the supervisor gets auto-bound tools like `transfer_to_researcher` and `transfer_to_analyst`, and "deciding the next agent" is just calling one of those tools. It's the standard tool-call pattern wearing a routing hat.

Convenient, but it hides a few things. You don't see what tools each sub-agent invoked or with what arguments. There's no obvious place to insert custom logic between routings. The library's "I've got it covered" is also "you can't see what I'm doing."

### Version B — building from scratch with `StateGraph`

The same behavior without `langgraph-supervisor`. About 1.5× the code, but every part is visible.

Four pieces matter.

**State** is the shared whiteboard every node reads and writes. Message accumulation works because LangGraph's `add_messages` reducer turns "return a new message" into "append to the list":

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str  # the supervisor's decision: which node next
```

The **supervisor node** decides via **text classification**, not a tool call. The system prompt asks for one word — `researcher` / `analyst` / `writer` / `FINISH` — and the response is parsed into `state["next"]`:

```python
def supervisor_node(state: AgentState) -> dict:
    response = model.invoke(
        [{"role": "system", "content": SUPERVISOR_PROMPT}] + state["messages"]
    )
    decision = response.content.strip().lower()
    if "finish" in decision:        next_node = "FINISH"
    elif "researcher" in decision:  next_node = "researcher"
    elif "analyst" in decision:     next_node = "analyst"
    elif "writer" in decision:      next_node = "writer"
    else:                           next_node = "FINISH"
    return {"messages": [...], "next": next_node}
```

The **routing function** reads `state["next"]` and tells LangGraph where to send control:

```python
def route_after_supervisor(state):
    return END if state["next"] == "FINISH" else state["next"]
```

**Graph assembly** wires it all together with `add_conditional_edges`. Every sub-agent unconditionally returns to the supervisor:

```python
graph_builder.add_conditional_edges(
    "supervisor", route_after_supervisor,
    {"researcher": "researcher", "analyst": "analyst",
     "writer": "writer", END: END},
)
graph_builder.add_edge("researcher", "supervisor")
graph_builder.add_edge("analyst", "supervisor")
graph_builder.add_edge("writer", "supervisor")
```

That's all of it. What the library was hiding is now on the surface.

## Tool call vs text classification

The real difference between the two versions is the routing mechanism — the same decision ("who's next?") expressed in two different output formats.

| | Version A | Version B |
|---|---|---|
| Input (instruction) | Natural-language prompt | Natural-language prompt |
| Output format | Tool call (JSON) | Plain text (`"researcher"`) |
| Routing handled by | LangGraph internals | Our function parses |
| Argument passing | Easy | Awkward |
| Custom interception | Hard | Easy |

Tool calls are clean when there are many options or when the call needs structured arguments. Text classification fits better when the choices are few and the decision is fast — and it's slightly cheaper, since you skip the tool-definition tokens. Our supervisor picks one of four labels, so the latter is the natural fit.

## What actually happened on a real query

I ran the same question — *"What is LangGraph in one paragraph?"* — through both versions. The interesting thing about Version B: the supervisor called `researcher` once and went straight to FINISH. The search result was already a one-paragraph answer, and the supervisor recognized that. It skipped `analyst` and `writer` entirely.

Whether that's good or bad depends on what you want. For a casual question, it's efficient. If your product needs *"every report goes through analysis and writing,"* the supervisor's autonomy is now the problem. In Version B, you can track which agents have already run inside the routing function and force a fixed sequence. In Version A, this is nearly impossible to add cleanly. **That's the actual value of building the graph yourself.**

## What I'm taking away

Three things I'm writing down before the next step.

**Multi-agent isn't free.** LLM calls go up (seven for this query), cost roughly two-to-three×, latency rises. Ask first whether a single agent is enough, and only split when it isn't. Anthropic's own guidance treats multi-agent as a last resort — and after building one, that's not corporate cover, it's a design rule.

**Libraries hide the learning.** If I'd stopped at Version A, I could say I'd "used" the supervisor pattern, but not that I understood it. Rebuilding it as Version B is what made state, edges, and routing stick. The reason hiring conversations ask "can you build this without the framework?" makes more sense from this side of the exercise.

**Supervisor decisions reduce to an output-format question.** Tool call or text label, the underlying choice is *"how do I want the LLM to answer?"* That single decision was almost the whole routing mechanism.

## Next

Part 5 layers a **quality loop** on top of this. A reviewer checks the writer's output, and if it's insufficient, the work goes back to the researcher. Whether to leave that decision to the supervisor or bake it into the routing function — today's tradeoff returns one level deeper.

That's the point where the hand-built graph really starts to earn its keep.

*To be continued.*
