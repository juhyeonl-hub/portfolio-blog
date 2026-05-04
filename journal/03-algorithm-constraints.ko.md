---
title: "교과서 알고리즘이 실제 제약 앞에서 깨질 때"
excerpt: "push_swap에서 quicksort를 버리고 청크 기반 전략으로 간 과정."
tags: [Dev, Project]
---

## 배경

push_swap — 두 개의 스택과 11개의 연산만 가지고 정렬한다. 제약: 100개 입력에 ≤700 연산, 500개에 ≤5500 연산.

![push_swap 가용 연산](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_operations.png)

## 분석

처음에는 quicksort를 시도했다. 스택은 임의 접근을 허용하지 않는다. 연산 횟수가 제약을 넘었다. 청크 기반 전략으로 다시 설계했다.

![청크 기반 정렬 과정](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_chunk_sort.png)

![접근 방식별 연산 횟수 비교](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_comparison.png)

## 회고

알고리즘 선택은 단순히 시간 복잡도의 문제가 아니다. 실제 환경에는 제약이 있다. AI는 일반적인 최적해를 알려주지만, 특정 제약에 맞춰 다시 설계하는 일은 사람의 판단 영역이다.
