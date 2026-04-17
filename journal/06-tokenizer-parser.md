---
title: "토크나이저와 파서의 구조"
excerpt: "문자열을 실행 가능한 명령으로 변환하는 과정. minishell 파싱 설계."
tags: [Dev, Project]
---

## 배경

셸에 `echo "hello world" | wc -l > output.txt`을 입력하면, 이 문자열 자체로는 아무 의미가 없다. 셸이 이걸 분석해서 실행 가능한 구조로 변환해야 한다.

![문자열 → 실행까지의 변환 과정](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/06_parsing_flow.png)

## 해석

토크나이저의 역할은 문자열을 의미 있는 단위(토큰)로 쪼개는 거다. 단순히 공백으로 split하면 될 것 같지만, 따옴표 안의 공백은 무시해야 한다.

![토크나이징 규칙](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/06_token_rules.png)

```c
while (*input)
{
    if (*input == '\'' && state != IN_DOUBLE_QUOTE)
        state = (state == IN_SINGLE_QUOTE) ? DEFAULT : IN_SINGLE_QUOTE;
    else if (*input == '"' && state != IN_SINGLE_QUOTE)
        state = (state == IN_DOUBLE_QUOTE) ? DEFAULT : IN_DOUBLE_QUOTE;
    else if (is_space(*input) && state == DEFAULT)
        // 토큰 종료
    else if (is_special(*input) && state == DEFAULT)
        // |, >, < 등 특수 토큰
    else
        // 현재 토큰에 문자 추가
    input++;
}
```

## 느낀점

"구조화되지 않은 입력을 구조화된 데이터로 변환하는" 과정이 생각보다 많은 곳에서 쓰인다. 컴파일러도, API 요청 파싱도, 프롬프트 설계도 같은 구조다.
