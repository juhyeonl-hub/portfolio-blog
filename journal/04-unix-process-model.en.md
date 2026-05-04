---
title: "Understanding the Unix Process Model with fork() and pipe()"
excerpt: "What happens behind ls | grep '.c'. The basics of process orchestration."
tags: [Dev, TIL]
---

## Background

When you type `ls -l | grep ".c" | wc -l`, three processes are created and connected via pipes inside the OS.

![Key system calls](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/04_syscalls.png)

## Analysis

![Pipeline execution flow](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/04_pipeline.png)

Critical rule: unused pipe ends must be closed. Otherwise EOF is never sent and the reading process waits forever.

```c
int fd[2];
pipe(fd);

pid_t pid1 = fork();
if (pid1 == 0)
{
    close(fd[0]);
    dup2(fd[1], STDOUT_FILENO);
    close(fd[1]);
    execve("/bin/ls", args, env);
}

pid_t pid2 = fork();
if (pid2 == 0)
{
    close(fd[1]);
    dup2(fd[0], STDIN_FILENO);
    close(fd[0]);
    execve("/usr/bin/grep", args, env);
}

close(fd[0]);
close(fd[1]);
waitpid(pid1, NULL, 0);
waitpid(pid2, NULL, 0);
```

## Reflection

Create processes, connect them, pass data, wait for completion. This pattern maps directly onto agentic systems that coordinate multiple AI agents.
