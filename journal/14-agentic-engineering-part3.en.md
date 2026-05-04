---
title: "Agentic Engineering with Orchestration (Part 3)"
excerpt: "Adding two more tools to the ReAct agent — and discovering that the function name beats the docstring at telling the LLM what a tool does."
tags: [Dev, AI, Agentic]
---

## Why multi-tool

The ReAct agent I built in Part 2 had exactly one tool: web search. Ask a question, hit Tavily, read the snippets, answer. It worked, but the limits were obvious — short snippets meant shallow answers, and questions with words like "latest" sometimes pulled answers from the model's training cutoff instead of reality.

So in Part 3 I added two more tools. I wanted to see how the agent would choose between them, and along the way I wanted an answer to a question that had been nagging me: **how do you actually describe a tool to an LLM so it uses the tool well?**

## What I built

`03_agent_with_tools.py`. The graph skeleton from Part 2 stayed the same. Only the tool list grew from one to three.

- **`get_current_date`** — returns today's date in `YYYY-MM-DD`. The instruction was: whenever the user asks about something time-sensitive, call this first and bake the year into your search query.
- **`fetch_url`** — given a URL, pull the article body. `requests` to fetch, `BeautifulSoup` to strip out `script`/`style`/`nav`/`footer` noise, truncate at 5000 characters, return clean error messages on timeouts and HTTP errors.
- A system prompt that laid out *when* to call each tool, plus a hard rule: only fetch 1–2 URLs per question, not the whole search result list.

```python
@tool
def get_current_date() -> str:
    """Returns today's date in YYYY-MM-DD format.

    Use this whenever the user asks about "latest", "recent", "current",
    or anything time-sensitive. Knowing today's date helps you formulate
    better search queries (e.g., adding the year to find truly recent info).
    """
    return datetime.now().strftime("%Y-%m-%d")
```

That code itself is unremarkable. The interesting part came when I started watching the agent run.

## Watching behavior with graph.stream()

`graph.invoke()` only shows the final answer. With three tools in play, I wanted to know which one the agent reached for, and in what order. So I switched to `graph.stream()` and printed every node's output as it happened.

```python
for chunk in graph.stream(...):
    for node_name, node_output in chunk.items():
        last_msg = node_output["messages"][-1]
        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            for tc in last_msg.tool_calls:
                print(f"tool call: {tc['name']}, args: {tc['args']}")
```

I asked: *"Tell me about Anthropic's latest Claude model, Opus 4.7, and its key improvements."*

The agent ran this sequence:

1. `get_current_date` — anchor itself in time
2. `tavily_search` with the year baked in: `"Claude Opus 4.7 2026"`
3. `fetch_url` on the most authoritative result
4. `fetch_url` again on a second authoritative source

Exactly the playbook I'd written into the system prompt. The act of *seeing* it run was the part that landed — not as debugging, but as the moment "the agent reasons about tools" stopped being an abstraction and became a concrete sequence of calls I could read.

## The real finding — function names beat docstrings

I could've stopped there, but one hypothesis was sitting in the back of my head: **what if I broke the docstring? Would the agent get confused?**

> Quick aside — a *docstring* is the `"""..."""` block written right under a Python function's signature. It's documentation for humans, but LangChain's `@tool` decorator also reads it and feeds it to the LLM as the tool's description. So writing a good docstring *is* — or so I assumed going in — the same thing as describing the tool well to the model.

I ran three experiments. Same question, same three tools. Each round I degraded the docstring and system prompt a little more.

| Round | docstring          | system prompt        | What I expected       | What actually happened |
|:-----:|:-------------------|:---------------------|:----------------------|:-----------------------|
| 1     | rich               | rich                 | works well            | 4 calls, deep answer   |
| 2     | `"Fetches a URL."` | rich                 | mild degradation      | **identical**          |
| 3     | `"Fetches a URL."` | `"Fetches a URL"`    | tool selection breaks | **identical**          |

I expected the agent to start fumbling. It didn't. Even with the docstring stripped to a single sentence and the system prompt reduced to a near-empty shell, Claude Haiku 4.5 looked at `fetch_url(url: str)` — just the signature — and called it at exactly the right moment.

This wasn't a fluke. The function name and the type hint alone had already told the model:

- "this thing fetches URLs"
- "it makes sense to call this *after* search returns links"

Everything I'd written in the docstring and the system prompt was reinforcing a conclusion the model had already reached.

### The design principle that fell out

This rearranged the priority list in my head when I sit down to write a tool.

![The four signals an LLM uses to understand a tool](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/14_signal_hierarchy.svg)

1. **The function name is the primary signal.** `fetch_url`, `get_current_date` — verb + noun, intent visible at a glance. `do_thing` is bad for humans and just as bad for LLMs.
2. **Type hints are decisive for argument understanding.** `url: str` settles "this takes a URL string" in one line.
3. **Docstrings are for what the name *can't* say.** Constraints ("don't call this on every URL"), timing ("call after search"), gotchas. A docstring that just restates what the function name already conveys is wasted tokens.
4. **System prompts are about *coordination between tools*.** Not how to use any single tool, but the shape of the multi-step flow: search → fetch → answer.
5. **It's most robust when all three overlap.** If one signal is weak, another picks up the slack. Defense in depth.

## Where Part 3 leaves me

When I started this series I called it "agentic engineering systems," which sounds grand. I should be honest — what I'm actually building is **one agent**. A system, in any meaningful sense, is still a long way off.

But the parts are accumulating. State, ReAct loops, multi-tool, observability via stream. I've started thinking of it less like a project to finish and more like a garden — you plant one thing, then another, and the shape emerges over time.

## Next

More tools, but more important: **memory**. Right now the agent answers and forgets. Ask a follow-up and it re-searches from scratch. Even a simple conversation buffer — and maybe a search-result cache on top of it — would be the second plant in the same garden.

*To be continued.*
