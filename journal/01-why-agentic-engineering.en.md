---
title: "Why a Java Backend Developer Went Through C to Agentic Engineering"
excerpt: "From Spring Boot to C to agentic. Why understanding the layer below matters more in the AI era."
tags: [Dev, Career]
---

## Background

I worked as a Java/Spring Boot developer in Korea's financial sector for about two years. Hyundai Capital, Hyundai Commercial, Korean National Police Agency, DB Insurance. The domains changed per project, but the work was similar — build APIs on Spring, connect Oracle, wire up the frontend.

While working, I watched AI develop rapidly. Code generation tools were emerging, agents were starting to handle tasks autonomously. I wanted to move in that direction. But there was a problem: to judge whether AI-generated code is correct, you need to understand the layers the framework hides from you.

![What the framework does for you](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/table_framework_comparison.png)

## Analysis

So I chose Hive Helsinki. A place to build a solid CS foundation and start a career in Europe.

Working with C and C++ in systems programming at Hive changed things. After implementing a pipeline from scratch in minishell, I started seeing what Spring's async processing is actually built on. After experiencing deadlocks firsthand in philo, I realized concurrency isn't "just run it and see" — it's a design problem.

Agentic engineering is ultimately about designing systems where multiple AI agents each perform their role and combine results to complete larger tasks. This structure is fundamentally the same as the Unix process model.

![Unix process model vs Agentic engineering](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/diagram_unix_vs_agentic.png)

## Reflection

In an era where AI generates code fast, what matters for a developer isn't typing speed — it's the ability to judge whether that code is correct. That judgment comes from knowing the layer below. That's why this path was right.
