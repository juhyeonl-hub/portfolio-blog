---
title: "데드락은 왜 생기고 어떻게 막는가"
excerpt: "식사하는 철학자 문제로 배운 동시성 설계의 핵심."
tags: [Dev, TIL]
---

## 배경

식사하는 철학자 문제. N명의 철학자가 원형 테이블에 앉아 있고, 포크가 N개. 모든 철학자가 동시에 왼쪽 포크를 잡으면? 아무도 오른쪽 포크를 잡을 수 없다. 전원 대기. 이게 데드락이다.

![식사하는 철학자 문제](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_philosophers.png)

![동시성 문제 유형](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_concurrency_types.png)

## 해석

philo에서 이걸 pthread와 mutex로 구현했다. 해결: 짝수 번호 철학자는 오른쪽 포크부터 잡게 한다.

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

검증은 ThreadSanitizer(`-fsanitize=thread`)로 데이터 레이스를 탐지하고, 다양한 조건에서 수천 번 반복 테스트해야 한다.

## 느낀점

동시성은 "잘 돌아가는 것 같으면 된다"가 아니라 "증명 가능한 설계"의 영역이다. 여러 AI 에이전트가 동시에 작업할 때 충돌을 방지하는 설계와 직접 연결된다.
