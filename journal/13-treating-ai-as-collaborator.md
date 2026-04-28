---
title: "Treating AI as a Collaborator, Not a Tool"
excerpt: "How I work with Claude Code, and why the loop matters more than the model."
tags: [Dev, AI, Agentic]
---

*How I work with Claude Code, and why the loop matters more than the model.*

## Two things became clear, fast

When I started using Claude Code seriously, two things became obvious very quickly.

The first: AI generates code at a speed that's genuinely hard to match by hand.

The second: that code goes in the wrong direction more often than you'd think.

It drifts from the spec. It picks the wrong architecture. It ships code that *looks* right but misses the actual intent. For a while, I spent more time cleaning up after the agent than I would have spent writing it myself. Some days, doing it manually was just faster.

After a long stretch of fighting this, I changed how I worked. This post is a record of that workflow. Most of it took shape while I was building [Opiter](https://github.com/juhyeonl-hub/opiter), an open-source desktop document workbench.

## The principle: humans decide, agents execute

The most common mistake in AI-assisted development is **handing decisions to the agent**. You say "build this feature" and the agent runs off in some direction. There's no good reason to expect that direction matches yours.

My workflow inverts that. **I make the decisions. The agent executes them.** And the decisions are written down *before* any code gets touched.

That's the one-line version. Here's how it actually plays out.

## Phase 1 — Setup: spec before code

When I start a new project, I don't write code. I don't ask the agent to write code either. The first thing I hand the agent is a set of operating rules.

These rules describe how the agent should behave: what it's allowed to do automatically, what needs explicit approval, how to handle failures, what it must never do without telling me. The rules took a long time to develop, and they're an asset I reuse across every project. Once written, they don't change much.

With those rules in place, the agent asks me a fixed set of questions. What's the final goal of this project? What stack, what environment? What are the main features? What does *done* look like — not just "build passes" but actual verifiable outputs?

I answer. The agent then generates a `PROJECT_BRIEF.md` from my answers. That document becomes the source of truth for the project. Not the code — the brief. If the brief and the code disagree, the code is what's wrong.

![The Workflow — From Idea to v1.0](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/13_workflow.svg)

## Phase 2 — The execution loop

Once the brief exists, the workflow is simple. The simplicity is the point.

The agent works on **one step at a time**. Before starting a step, it has to do three things:

- State the goal of the step in one line.
- Define exactly what files and functions are in scope.
- Write down the expected inputs, outputs, and failure modes.

Only after that does it touch any code.

These three steps look minor on paper. In practice, they're where most of the wrong directions get caught. When the agent has to say out loud what it's about to do, it catches itself before generating a thousand lines of code I'd have to throw away.

When the step finishes, the agent builds, runs the code, and verifies the result. "Looks correct" doesn't count. There has to be an actual execution result. Then it produces a self-verification report — what it tested, what inputs it used, what outputs it observed, what it *didn't* test. Honest gaps included.

If the step doesn't need my hands, the agent moves on. If it does — say, a UI change, or a flow that needs human eyes — the agent hands me test cases. I run them, look at the output, and decide what's next: fix something, move forward, or stop adding features and ship a prototype of what's already working.

## Phase 3 — Failure handling: classify before you fix

Failures don't trigger an immediate fix attempt. That's the rule that took me the longest to learn.

When something breaks, the agent's instinct is to start fixing. That's how spirals begin: a wrong fix on top of a wrong diagnosis on top of an unrelated symptom. By the time I notice, three layers of half-applied changes are entangled and the original problem is invisible.

So failures get classified first.

![Failure Handling — Classify Before You Fix](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/13_failure.svg)

If the failure shows external signals — network errors, environment mismatches, dependency issues, model limits — the agent retries once without changing any code. If it clears, it was transient and gets logged. If it doesn't, the agent stops and reports back.

If there are no external signals, the failure is internal. The agent states the cause in one line. Then it picks a fix that addresses *that* cause. And — this is the rule that matters most — it never uses the same fix method twice. If a fix didn't work, the diagnosis was wrong. Repeating it won't change the outcome.

This single classification step is what stops the agent from spiraling. It also gives me a clean signal for when I actually need to step in, instead of being pinged for every retry.

## What this gets you

The result of doing this consistently is something like Opiter — a v0.1 release of a working PDF and DOCX workbench in Python and PySide6. The features it has, it has reliably, with self-verified test paths. The features it doesn't have are documented, not silently broken.

The same workflow built [juhyeonl.dev](https://juhyeonl.dev). The same loop, a completely different stack and product domain. The pattern transfers.

## What I actually learned

I used to think "AI-assisted development" meant the AI was the important part. It isn't.

What makes this kind of work hold up is the loop the engineer builds around the agent. A clear spec. Steps small enough to verify. Mandatory review. A failure-handling rule that doesn't let the agent paper over its own mistakes.

When all of that is in place, the agent stops being something I clean up after. It starts behaving like a real engineering collaborator — one I happen to drive a lot harder than a human.

That's how I work now.

---

**Projects:**
- Opiter — [github.com/juhyeonl-hub/opiter](https://github.com/juhyeonl-hub/opiter)
- Portfolio — [juhyeonl.dev](https://juhyeonl.dev)
