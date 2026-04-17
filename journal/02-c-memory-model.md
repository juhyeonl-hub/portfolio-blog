---
title: "malloc과 free로 이해하는 C 메모리 모델"
excerpt: "GC 없는 세계에서 메모리를 직접 관리하면서 배운 것들."
tags: [Dev, TIL]
---

## 배경

프로그램이 실행되면 운영체제는 메모리를 네 영역으로 나눠서 할당한다.

![프로세스 메모리 구조](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_structure.png)

스택은 함수가 호출될 때 자동으로 공간이 잡히고, 함수가 끝나면 자동으로 사라진다. 힙은 다르다. 프로그래머가 malloc으로 직접 요청하고, free로 직접 반환해야 한다.

## 해석

malloc과 free의 기본 사용법은 단순하다.

```c
int *arr = (int *)malloc(sizeof(int) * 10);
if (arr == NULL)
    return (-1);
arr[0] = 42;
free(arr);
```

문제는 이게 복잡해질 때 생긴다. ft_split에서 이중 포인터를 malloc할 때, 중간에 malloc이 실패하면 이미 할당한 메모리를 전부 해제하고 NULL을 반환해야 한다.

![흔한 메모리 버그 유형](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_bugs.png)

Valgrind로 이런 버그를 잡는다.

```bash
valgrind --leak-check=full ./program
```

## 느낀점

C에서 메모리를 직접 관리하는 건 확실히 번거롭다. 근데 이걸 직접 해보고 나니까 GC가 "대신 해주고 있던 것"이 뭔지 정확히 알게 됐다. AI가 C 코드를 생성했을 때 가장 흔한 실수가 에러 경로에서 free를 빠뜨리는 건데, 이 구조를 모르면 그게 왜 문제인지 자체를 모른다.
