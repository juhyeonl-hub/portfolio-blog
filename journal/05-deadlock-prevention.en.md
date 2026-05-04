---
title: "Why Deadlocks Happen and How to Prevent Them"
excerpt: "Lessons in concurrency design from the Dining Philosophers problem."
tags: [Dev, TIL]
---

## Background

N philosophers, N forks. Everyone grabs left fork simultaneously. No one can grab right. Deadlock.

![Dining Philosophers Problem](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_philosophers.png)

![Concurrency problem types](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_concurrency_types.png)

## Analysis

Solution: even-numbered philosophers grab right fork first.

```c
if (id % 2 == 0)
{
    pthread_mutex_lock(&forks[(id + 1) % N]);
    pthread_mutex_lock(&forks[id]);
}
else
{
    pthread_mutex_lock(&forks[id]);
    pthread_mutex_lock(&forks[(id + 1) % N]);
}
```

Verify with ThreadSanitizer. Run thousands of iterations.

## Reflection

Concurrency isn't "it seems to work, so it's fine" — it's provable design. This connects directly to designing multi-agent systems where agents access shared resources simultaneously.
