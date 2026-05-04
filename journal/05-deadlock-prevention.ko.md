---
title: "데드락은 왜 일어나고 어떻게 막는가"
excerpt: "식사하는 철학자 문제에서 배우는 동시성 설계의 교훈."
tags: [Dev, TIL]
---

## 배경

N명의 철학자, N개의 포크. 모두가 동시에 왼쪽 포크를 잡는다. 아무도 오른쪽을 잡지 못한다. 데드락.

![식사하는 철학자 문제](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_philosophers.png)

![동시성 문제 유형](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_concurrency_types.png)

## 분석

해법 — 짝수 번호의 철학자는 오른쪽 포크를 먼저 잡는다.

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

ThreadSanitizer로 검증. 수천 회 반복 실행.

## 회고

동시성은 "돌려보니 잘 되더라"가 아니다 — 증명 가능한 설계의 문제다. 이건 여러 에이전트가 동시에 공유 자원에 접근하는 멀티에이전트 시스템 설계로 그대로 이어진다.
