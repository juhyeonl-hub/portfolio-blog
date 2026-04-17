---
title: "AI-first 개발 워크플로우를 직접 설계해본 기록"
excerpt: "코드를 짜는 사람에서 지시하고 판단하고 검증하는 사람으로."
tags: [Dev, AI]
---

## 배경

AI를 보조 도구로 쓰는 것과, 개발 루프 자체를 AI 중심으로 설계하는 것은 다르다.

![기존 방식 vs AI-first 방식](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/09_comparison.png)

## 해석

Claude Code로 실제 프로젝트를 진행하면서 느낀 핵심은, 두 가지가 필요하다는 거다.

**첫째, 명확한 지시 능력.** "이거 만들어줘"가 아니라 "이 기능을 이 스택으로, 이 데이터 모델 기반으로, 이 API 스펙에 맞게 만들어줘"라고 해야 쓸 수 있는 결과가 나온다.

**둘째, 검증 능력.** AI가 만든 코드가 맞는지 판단해야 한다.

![AI 코드 검증 체크리스트](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/09_checklist.png)

![AI-first 개발 루프](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/09_ai_loop.png)

## 느낀점

AI-first 개발이 "AI가 대신 코드를 써주는 것"이라고 생각하면 오해다. 전체 설계를 머릿속에 들고 있어야 하고, AI가 내놓은 결과물의 품질을 판단해야 한다. AI 시대에 개발자의 가치는 "코드를 빨리 짜는 것"이 아니라 "좋은 코드와 나쁜 코드를 구분하는 것"에 있다.
