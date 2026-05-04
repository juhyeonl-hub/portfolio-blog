---
title: "What's Different When a Systems Programmer Does Agentic Engineering"
excerpt: "From Unix process models to agentic systems. The final post in the series."
tags: [Dev, AI, Career]
---

## Background

Agentic engineering: designing systems where multiple AI agents each perform their role, combining results to complete larger tasks.

## Analysis

![Systems programming → Agentic mapping](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/10_mapping.png)

![Process pipeline vs Agentic pipeline](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/10_pipeline.png)

What the shell does — create processes, connect with pipes, manage data flow, handle failures — is exactly what an agentic orchestrator does.

Concurrency applies directly. Multiple agents accessing the same data simultaneously cause collisions. Same problems as Post 5, just with queues instead of mutexes.

Parser design connects too. Prompting an LLM is "converting unstructured natural language into structured commands" — the same mindset from Post 6.

## Reflection

Agentic engineering isn't an entirely new field. It's systems programming concepts at a higher abstraction level.

Someone who understands process orchestration designs agent orchestration better. Someone who's experienced concurrency problems prevents multi-agent collisions better. Someone who's managed memory handles context management better.

The stronger the foundation, the wider the range of what you can do on top. That's everything this series wanted to say.
