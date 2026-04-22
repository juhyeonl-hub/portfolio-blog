---
title: "Agentic Engineering with Orchestration (Part 2)"
excerpt: "Building the first LangGraph agent — a minimal ReAct loop, and the moment the graph worked perfectly but the agent still refused to search."
tags: [Dev, AI, Agentic]
---

Part 1 laid out the project skeleton and design principles. This one is about actually building the first agent with LangGraph — a single LLM with one search tool, the simplest possible ReAct loop. The code is short, but building it surfaced more than I expected.

## What I was trying to build

An agent that takes a question, searches the web when needed, and answers with fresh information. Four concepts had to click:

- **State**: the accumulating record of messages during a run
- **Node**: a function that reads state and returns updates
- **Edge**: the connection between nodes (unconditional or conditional)
- **ReAct loop**: think → act → observe, repeated until done

## Why the State definition looks odd at first

The line that puzzled me longest:

```python
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
```

By default, LangGraph overwrites state fields on each update. If a node returns `{"messages": [new_message]}`, the whole list gets replaced. But a conversational agent needs history to accumulate. The `add_messages` reducer tells LangGraph: don't overwrite, append.

Python's `Annotated` was originally a way to attach metadata to types. LangGraph repurposes it as a channel for state-update rules. Odd at first, but clean once it clicks — the combine rule lives right next to the field declaration.

## How the LLM "knows" about tools

`llm.bind_tools([search_tool])` is the key line.

An LLM doesn't know tools exist unless you register them. After binding, responses come in one of two shapes: plain text, or an `AIMessage` with a populated `tool_calls` field carrying a structured "invoke this tool with these arguments" signal. The framework catches that, runs the tool, and feeds the result back.

The interesting part: **the LLM itself decides whether to call a tool.** We don't hardcode "if the query mentions X, search." We trust the model's judgment. That trust turned out to be the central issue of the day.

## Assembling the graph

```
START → agent → (conditional) → tools → agent → ... → END
```

After each `agent` node, LangGraph checks the last message. Tool calls present → route to `tools`. Otherwise → `END`. The built-in `tools_condition` handles that check. After `tools` runs, control returns to `agent`, where the LLM either finalizes an answer or asks for another search. That cycle is the ReAct loop in its most minimal form.

## The first run — and an unexpected refusal

I asked: *"What's the latest Claude model Anthropic released in 2026?"*

The answer:

> "I'm sorry, but I can't retrieve information about 2026. At the current point in time, 2026 is in the future, so those events haven't happened yet."

**It didn't search at all.** The LLM decided "2026 = future" and exited without invoking the tool.

My graph worked exactly as designed. The problem was that **the LLM has no idea when it is**. Anything past its training cutoff looks like "the future." Nothing in the setup told it otherwise.

## The fix: a system prompt

No code changes. Just a prompt.

```python
SYSTEM_PROMPT = """You are a research agent that answers using web search.

Current date: April 22, 2026

# Operating principles
1. Your training data may be outdated. For current information, use TavilySearch
   before answering.
2. If a date in the question is before the current date, it's the PAST, not the
   future — it's searchable. Try searching before saying "I don't know."
"""
```

Prepended as a `SystemMessage` on every LLM call in `agent_node`. Same question, second run: the agent called Tavily, got real results, and answered with "Claude Opus 4.7, released April 9, 2026" — a specific fact with a source. Same code, different prompt.

## What I took from this

**Structural correctness isn't behavioral correctness.** The graph can be flawless and the agent still won't do what you want, because the graph and the prompt are two separate layers. The graph defines what's possible; the prompt shapes what actually happens inside each LLM call.

The specific surprise: even background context — *what year is it* — has to be stated explicitly. LLMs don't carry temporal grounding on their own. If you want behavior that depends on "now," you have to inject "now."

One more observation: I didn't put the system prompt in State itself. It's prepended inside the node function on each invocation. That keeps identity (the system prompt) separate from memory (the conversation history). They live on different time scales and probably belong in different places.

## Guardrails from the start

Even for a learning project, a few safeties were worth putting in up front:

- `recursion_limit=10` — kills runaway loops before they burn credits
- `temperature=0` — deterministic output for easier debugging
- `max_tokens=1024` — caps any single generation
- Key validation before the graph runs

The validation paid off immediately. My first run crashed with a `UnicodeEncodeError` from deep in the HTTP stack. The cause: I'd left a Korean placeholder in my `.env` instead of the real key. HTTP headers only accept ASCII, so the non-ASCII characters exploded at encoding time. With validation up front, this became a one-line error instead of a twenty-line stack trace.

## Next

Part 3 will move to **supervisor + multi-agent orchestration**. I'll take today's agent as a building block for a system with separate researcher / analyst / writer agents, routed by a supervisor. Along the way I want to look at where single-agent is enough and where the orchestration cost is actually justified.

*To be continued.*
