---
title: "malloc과 free로 이해하는 C의 메모리 모델"
excerpt: "GC가 없는 세상에서 메모리를 직접 관리한다는 것."
tags: [Dev, TIL]
---

## 배경

프로그램이 실행되면 OS는 메모리를 네 영역으로 나눈다.

![프로세스 메모리 레이아웃](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_structure.png)

스택은 자동으로 할당된다. 힙은 명시적인 malloc과 free를 요구한다. 자바에서는 GC가 처리해준다. C에는 GC가 없다.

## 분석

```c
int *arr = (int *)malloc(sizeof(int) * 10);
if (arr == NULL)
    return (-1);
arr[0] = 42;
free(arr);
```

상황이 복잡해지면 문제가 드러난다. ft_split에서 중간에 malloc이 실패하면, 앞서 할당했던 메모리를 모두 free하고 NULL을 반환해야 한다.

![자주 발생하는 메모리 버그](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_bugs.png)

```bash
valgrind --leak-check=full ./program
```

## 회고

직접 해보고 나서야 GC가 "대신 해주는 일"이 정확히 무엇인지 알게 됐다. AI가 C 코드를 생성할 때 가장 흔한 실수는 에러 경로에서 free를 빠뜨리는 것 — 이 구조를 이해하지 못하면 그게 왜 문제인지 보이지조차 않는다.
