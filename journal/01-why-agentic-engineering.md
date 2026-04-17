---
title: "Java 백엔드 개발자가 C를 거쳐 에이전틱 엔지니어링으로 간 이유"
excerpt: "Spring Boot에서 C로, 그리고 에이전틱으로. 왜 아래 레이어를 배우는 게 AI 시대에 더 중요한가."
tags: [Dev, Career]
---

## 배경

한국 금융권에서 Java/Spring Boot로 약 2년 일했다. 현대캐피탈, 현대커머셜, 경찰청, DB손해보험. 프로젝트마다 도메인은 달랐지만 하는 일은 비슷했다. Spring 위에 API 올리고, Oracle 붙이고, 프론트 연결하는 구조.

일을 하면서 AI가 빠르게 발전하는 걸 봤다. 코드를 생성해주는 도구들이 나오고, 에이전트가 알아서 작업을 수행하는 시대가 오고 있었다. 그쪽으로 방향을 잡고 싶었다. 근데 한 가지 문제가 있었다. AI가 만든 코드가 맞는지 틀린지 판단하려면, 프레임워크가 숨기고 있는 아래 레이어를 알아야 한다.

![프레임워크가 대신 해주는 것](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/table_framework_comparison.png)

## 해석

그래서 Hive Helsinki를 선택했다. CS 기반을 제대로 쌓을 수 있고, 유럽에서 커리어를 시작할 수 있는 곳이었다.

Hive에서 C와 C++로 시스템 프로그래밍을 하면서 달라진 게 있다. minishell에서 파이프라인을 직접 구현하고 나니까, Spring의 비동기 처리가 어떤 원리 위에 있는지가 보이기 시작했다. philo에서 데드락을 직접 겪고 나니까, 동시성이 "돌려보면 되지"가 아니라 설계의 문제라는 걸 체감했다.

에이전틱 엔지니어링은 결국 여러 AI 에이전트가 각자 역할을 수행하고, 결과를 조합해서 큰 작업을 완성하는 시스템을 설계하는 거다. 이 구조는 Unix 프로세스 모델과 본질적으로 같다.

![Unix 프로세스 모델 vs 에이전틱 엔지니어링](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/diagram_unix_vs_agentic.png)

## 느낀점

AI가 빠르게 코드를 만들어주는 시대에, 개발자한테 중요한 건 코드를 타이핑하는 속도가 아니라 그 코드가 맞는지 판단하는 능력이다. 그 판단력은 아래 레이어를 아는 데서 온다. 그래서 이 경로가 맞았다고 생각한다.
