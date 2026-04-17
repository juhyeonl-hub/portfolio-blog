---
title: "Understanding the C Memory Model with malloc and free"
excerpt: "Managing memory manually in a world without GC."
tags: [Dev, TIL]
---

## Background

When a program runs, the OS divides memory into four regions.

![Process memory layout](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_structure.png)

The stack allocates automatically. The heap requires explicit malloc and free. In Java, the GC handles this. C has no GC.

## Analysis

```c
int *arr = (int *)malloc(sizeof(int) * 10);
if (arr == NULL)
    return (-1);
arr[0] = 42;
free(arr);
```

Problems emerge when things get complex. In ft_split, if a malloc fails midway, you must free all previously allocated memory and return NULL.

![Common memory bugs](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_bugs.png)

```bash
valgrind --leak-check=full ./program
```

## Reflection

After doing it myself, I understood exactly what the GC "does for you." The most common mistake when AI generates C code is forgetting to free on error paths — and if you don't understand this structure, you can't even see why that's a problem.
