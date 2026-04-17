---
title: "교과서 알고리즘이 실전 제약 앞에서 깨질 때"
excerpt: "push_swap에서 퀵소트를 버리고 청크 전략으로 재설계한 이야기."
tags: [Dev, Project]
---

## 배경

push_swap은 두 개의 스택(a, b)과 11가지 연산만으로 정렬하는 과제다.

![push_swap 사용 가능 연산](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_operations.png)

제약 조건: 100개 입력 시 700회 이내, 500개 입력 시 5500회 이내. 교과서적으로 생각하면 퀵소트가 답이다. 근데 이 환경에서는 바로 적용이 안 된다.

## 해석

퀵소트를 먼저 시도했다. 스택은 임의 접근이 안 된다. 피벗보다 작은 값을 b로 옮기려면 회전 연산이 과도하게 필요하다. 이론적 시간 복잡도가 좋아도 실제 연산 횟수가 제약을 초과했다.

결국 퀵소트를 버리고 청크 기반 전략으로 재설계했다.

![청크 기반 정렬 과정](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_chunk_sort.png)

![접근 방식별 연산 횟수 비교](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_comparison.png)

## 느낀점

알고리즘 선택이 "시간 복잡도만 보면 되는 문제"가 아니라는 걸 배웠다. 실제 환경에는 항상 제약이 있고, 그 제약에 맞는 전략을 설계해야 한다. AI는 일반적인 최적해를 준다. 근데 특수한 제약을 반영한 재설계는 사람이 판단해야 한다.
