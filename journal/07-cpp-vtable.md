---
title: "C++ vtable — virtual을 붙이면 무슨 일이 생기는가"
excerpt: "동적 디스패치의 내부 구현과 다이아몬드 상속 문제."
tags: [Dev, TIL]
---

## 배경

C++에서 `virtual`을 붙이면 런타임에 호출할 함수가 결정된다. 컴파일러가 이걸 실제로 어떻게 구현하는지를 알면, 상속 설계 판단이 달라진다.

```cpp
Animal *a = new Dog();
a->speak();  // "Woof" — 런타임에 Dog::speak() 호출
```

## 해석

컴파일러는 vtable(가상 함수 테이블)을 만든다.

![vtable 구조와 동적 디스패치](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_vtable.png)

각 클래스마다 vtable이 하나 생기고, 각 객체 안에 vptr이 들어간다. `virtual` 함수가 있으면 객체 크기가 포인터 하나만큼 늘어난다.

### 다이아몬드 상속 문제

![다이아몬드 상속 문제](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_diamond.png)

virtual 상속으로 해결하지만, 메모리 레이아웃이 복잡해지고 성능 오버헤드가 생긴다.

![virtual의 비용](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_virtual_cost.png)

## 느낀점

이걸 알고 나면 "정말 virtual이 필요한가, 아니면 composition으로 해결할 수 있는가"를 먼저 생각하게 된다. virtual은 편하지만 공짜가 아니다.
