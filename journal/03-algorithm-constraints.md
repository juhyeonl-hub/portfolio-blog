---
title: "When Textbook Algorithms Break Against Real Constraints"
excerpt: "Abandoning quicksort for a chunk-based strategy in push_swap."
tags: [Dev, Project]
---

## Background

push_swap: sort using only two stacks and 11 operations. Constraints: ≤700 ops for 100 inputs, ≤5500 for 500.

![push_swap available operations](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_operations.png)

## Analysis

I tried quicksort first. Stacks don't allow random access. Operation count exceeded the constraint. Redesigned with a chunk-based strategy.

![Chunk-based sorting process](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_chunk_sort.png)

![Operation count by approach](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_comparison.png)

## Reflection

Algorithm selection isn't just about time complexity. Real environments have constraints. AI gives the general optimal solution, but redesigning for specific constraints is a human judgment call.
