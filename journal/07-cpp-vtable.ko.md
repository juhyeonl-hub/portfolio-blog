---
title: "C++ vtable — virtual을 붙이면 무슨 일이 일어나는가"
excerpt: "동적 디스패치의 내부 구조와 다이아몬드 상속 문제."
tags: [Dev, TIL]
---

## 배경

```cpp
Animal *a = new Dog();
a->speak();  // "Woof" — Dog::speak() called at runtime
```

타입은 `Animal*`인데 `Dog::speak()`가 실행된다. 이게 동적 디스패치다.

## 분석

컴파일러는 클래스마다 vtable을, 객체마다 vptr을 만든다.

![vtable 구조와 동적 디스패치](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_vtable.png)

### 다이아몬드 상속

![다이아몬드 상속 문제](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_diamond.png)

가상 상속(virtual inheritance)이 해결해주지만, 복잡성과 오버헤드가 따라붙는다.

![virtual의 비용](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_virtual_cost.png)

## 회고

이걸 이해하고 나면 "정말 virtual이 필요한가, 컴포지션으로 해결할 수 있는가"부터 묻게 된다. virtual은 편하지만 — 공짜는 아니다.
