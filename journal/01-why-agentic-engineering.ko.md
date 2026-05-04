---
title: "자바 백엔드 개발자가 C 언어를 거쳐 에이전틱 엔지니어링으로 간 이유"
excerpt: "Spring Boot에서 C로, 다시 에이전틱으로. AI 시대에 한 층 아래의 레이어를 이해하는 일이 더 중요해진 이유."
tags: [Dev, Career]
---

## 배경

한국 금융권에서 약 2년간 자바/스프링 부트 개발자로 일했다. 현대캐피탈, 현대커머셜, 경찰청, DB손해보험. 프로젝트마다 도메인은 달랐지만 일은 비슷했다 — Spring으로 API를 짜고, Oracle을 붙이고, 프론트엔드와 연결하는 일.

일하는 동안 AI가 빠르게 발전하는 걸 지켜봤다. 코드 생성 도구가 등장했고, 에이전트가 자율적으로 작업을 처리하기 시작했다. 그 방향으로 가고 싶었다. 그런데 문제가 있었다 — AI가 만든 코드가 맞는지 판단하려면, 프레임워크가 가려놓는 그 아래 레이어를 이해해야 했다.

![프레임워크가 대신 해주는 일](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/table_framework_comparison.png)

## 분석

그래서 Hive Helsinki를 골랐다. 견고한 CS 기초를 쌓고 유럽에서 커리어를 시작할 수 있는 곳.

Hive에서 C와 C++로 시스템 프로그래밍을 다루면서 무언가가 바뀌었다. minishell에서 파이프라인을 처음부터 직접 구현하고 나니, Spring의 비동기 처리가 실제로 무엇 위에 올라앉아 있는지 보이기 시작했다. philo에서 데드락을 직접 겪고 나니 동시성은 "돌려보고 확인"이 아니라 — 설계 문제라는 걸 알게 됐다.

에이전틱 엔지니어링은 결국 여러 AI 에이전트가 각자의 역할을 수행하고 결과를 결합해 더 큰 작업을 완성하는 시스템을 설계하는 일이다. 이 구조는 본질적으로 Unix 프로세스 모델과 동일하다.

![Unix 프로세스 모델 vs 에이전틱 엔지니어링](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/diagram_unix_vs_agentic.png)

## 회고

AI가 코드를 빠르게 만들어내는 시대에 개발자에게 중요한 건 타이핑 속도가 아니다 — 그 코드가 맞는지 판단하는 능력이다. 그 판단은 한 층 아래 레이어를 아는 데서 나온다. 그래서 이 길이 옳았다.
