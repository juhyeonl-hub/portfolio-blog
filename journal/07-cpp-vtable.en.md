---
title: "C++ vtable — What Happens When You Add virtual"
excerpt: "Dynamic dispatch internals and the diamond inheritance problem."
tags: [Dev, TIL]
---

## Background

```cpp
Animal *a = new Dog();
a->speak();  // "Woof" — Dog::speak() called at runtime
```

The type is `Animal*` but `Dog::speak()` executes. This is dynamic dispatch.

## Analysis

The compiler creates a vtable per class and a vptr per object.

![vtable structure and dynamic dispatch](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_vtable.png)

### Diamond Inheritance

![Diamond inheritance problem](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_diamond.png)

Virtual inheritance solves it, but adds complexity and overhead.

![Cost of virtual](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/07_virtual_cost.png)

## Reflection

Once you understand this, you start asking "Do I really need virtual, or can composition solve this?" first. Virtual is convenient, but it's not free.
