---
title: "토크나이저와 파서의 구조"
excerpt: "원시 문자열을 실행 가능한 명령으로 변환한다는 것 — minishell 파싱이 동작하는 방식."
tags: [Dev, Project]
---

## 배경

`echo "hello world" | wc -l > output.txt` — 이 문자열은 그 자체로는 아무 의미가 없다. 셸은 이걸 분석해 실행 가능한 구조로 변환해야 한다.

![문자열 → 실행: 변환 흐름](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/06_parsing_flow.png)

## 분석

![토크나이징 규칙](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/06_token_rules.png)

핵심은 상태 관리 — 따옴표 안에 있는지 여부에 따라 문자가 처리되는 방식이 달라진다.

```c
while (*input)
{
    if (*input == '\'' && state != IN_DOUBLE_QUOTE)
        state = (state == IN_SINGLE_QUOTE) ? DEFAULT : IN_SINGLE_QUOTE;
    else if (*input == '"' && state != IN_SINGLE_QUOTE)
        state = (state == IN_DOUBLE_QUOTE) ? DEFAULT : IN_DOUBLE_QUOTE;
    else if (is_space(*input) && state == DEFAULT)
        // End current token
    else if (is_special(*input) && state == DEFAULT)
        // Special token (|, >, <)
    else
        // Append to current token
    input++;
}
```

## 회고

"비정형 입력을 정형 데이터로 변환한다"는 일은 어디에나 등장한다 — 컴파일러, API 파싱, 프롬프트 설계. 안정성의 열쇠는 상태 기반 접근법이었다.
