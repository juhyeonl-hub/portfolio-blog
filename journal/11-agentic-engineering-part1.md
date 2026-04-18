---
title: "Agentic Engineering with Orchestration (Part 1)"
excerpt: "Building a multi-agent system — why I started with the skeleton, and the design principles that kept surfacing."
tags: [Dev, AI, Agentic]
---

I've been studying agent systems lately. Beyond "throw a prompt at an LLM API and get a response" — structures where multiple agents collaborate, make judgments, and use tools. I'm slowly getting a feel for how to design such systems.

This first post is about **how I laid the skeleton of the project**, and the design principles I kept running into along the way. The agent logic itself starts from the next post.

---

## Why start with the structure

At first I thought, "let's just start by copying a LangGraph example." But when I re-examined the project goals, I had to change direction.

- It starts as a learning project, but will also serve as a portfolio piece
- I want to experiment with and compare multiple LLMs
- It should be runnable cost-free during development, and switchable to commercial models later

To satisfy these three conditions, what I needed first was **a structure that is not locked into a specific LLM provider**. If I had to edit the agent logic every time I swapped models, both experimenting and comparing would become a burden.

---

## LangChain and LangGraph

Clarifying the roles of the two libraries came first.

**LangChain** is a foundation block that bundles the repetitive pieces you hit when building LLM-powered apps. Model wrappers, prompt templates, output parsers, tool binding, memory, and so on. The key point is that it abstracts them so you can **call different providers through a single unified interface**.

**LangGraph** is a framework that builds **graph-based workflows** on top of that. An agent isn't simple sequential execution — it's a loop of "decide → act → observe → decide again." LangGraph expresses this through nodes and edges, conditional branches, and state management.

By analogy: LangChain is Lego bricks, and LangGraph is the blueprint for the complex machine you build from those bricks. For this project I'm going with LangGraph at the center, while the model calls inside leverage LangChain's unified interface.

---

## The Provider Factory pattern

LangChain ships provider-specific adapters (langchain-anthropic, langchain-google-genai, langchain-groq, etc.), and they all implement a common interface called `BaseChatModel`. Taking advantage of this, I consolidated model creation in one place using the **Factory pattern**.

```python
def get_llm(provider=None, temperature=0.7, max_tokens=1024) -> BaseChatModel:
    provider = (provider or Config.LLM_PROVIDER).lower()

    if provider == "gemini":
        return ChatGoogleGenerativeAI(model=..., temperature=..., ...)
    elif provider == "groq":
        return ChatGroq(model=..., temperature=..., ...)
    elif provider == "claude":
        return ChatAnthropic(model=..., temperature=..., ...)
    else:
        raise ValueError(f"Unsupported provider: {provider}")
```

The caller doesn't need to know the concrete class.

```python
llm = get_llm()
response = llm.invoke("a question")
```

Flip a single config value and internally it swaps between Gemini, Groq, or Claude. The agent logic doesn't change by a single line.

---

## Why this structure matters

There are a few reasons beyond "it's convenient."

**Separation of concerns.** When model creation logic lives in one place, the business logic (how agents decide and collaborate) doesn't get mixed with the infrastructure logic (which model we're using). Each can evolve independently.

**Testability.** When the caller depends on an interface rather than a concrete class, you can inject a fake LLM that doesn't actually hit an API for testing. Development speed and test cost both stay manageable.

**Extensibility.** When a new provider shows up, you only modify the Factory function. No hunting through dozens of call sites to add a branch.

**Practical upside.** Burn through development using free-tier Gemini/Groq, and switch to commercial models when you need production-grade quality — no code changes, just config.

---

## Feeling the performance difference

I compared response times across the three providers with the same prompt.

| Provider | Model | Response Time |
|---|---|---|
| Gemini | gemini-2.5-flash | 1.33s |
| Groq | llama-3.3-70b-versatile | 0.41s |
| Claude | claude-sonnet-4-5 | - (not measured) |

Groq is noticeably faster — it runs on dedicated LPU hardware. On the other hand, Gemini 2.5 Pro and Claude have the edge on model quality. Knowing these differences lets you pick per situation. Groq for conversational UI where speed matters, Gemini Pro or Claude for complex reasoning, Gemini Flash as a balanced default.

---

## Design principles, summarized

The principles that kept reappearing in today's work.

**Abstraction is an investment, not a cost.** At first, calling `ChatGoogleGenerativeAI(...)` directly is one line shorter. But once call sites multiply, the cost of changes explodes. Building a Factory upfront pays off in the end.

**Depend on interfaces, not implementations.** The caller only needs to know `BaseChatModel`, not `ChatAnthropic`. That's the core of provider-agnostic architecture.

**Keep configuration outside the code.** Which model to use, which key to use — these belong in environment-specific configuration, not in code. The same code should behave differently across dev and prod.

**Automate verification.** A separate script that checks whether configuration is valid and whether each provider actually responds lets you quickly isolate which layer broke when something goes wrong.

---

## What's next

With the skeleton in place, next is the actual agent logic. I'll build a single agent using LangGraph's nodes and edges, then extend to a Supervisor pattern where multiple agents collaborate. Along the way I'll work through state management, conditional routing, and tool calls in real code.

What's interesting is that the same principle keeps repeating. Agent roles will also be abstracted behind interfaces, and orchestration logic shouldn't know about individual agent implementations. The principle I applied to model providers shows up again one layer higher.

To be continued in Part 2.
