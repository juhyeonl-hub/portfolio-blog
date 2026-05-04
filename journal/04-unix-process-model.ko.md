---
title: "fork()와 pipe()로 이해하는 Unix 프로세스 모델"
excerpt: "ls | grep '.c' 뒤에서 일어나는 일. 프로세스 오케스트레이션의 기본."
tags: [Dev, TIL]
---

## 배경

`ls -l | grep ".c" | wc -l`을 입력하면, OS 안에서 세 개의 프로세스가 생성되고 파이프로 연결된다.

![핵심 시스템 콜](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/04_syscalls.png)

## 분석

![파이프라인 실행 흐름](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/04_pipeline.png)

핵심 규칙 — 사용하지 않는 파이프 끝은 반드시 닫아야 한다. 그러지 않으면 EOF가 절대 전송되지 않고 읽기 측 프로세스는 영원히 기다린다.

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

## 회고

프로세스를 만들고, 연결하고, 데이터를 넘기고, 완료를 기다린다. 이 패턴은 여러 AI 에이전트를 조율하는 에이전틱 시스템에 그대로 매핑된다.
