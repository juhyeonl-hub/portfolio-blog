---
title: "Tokenizer and Parser Structure"
excerpt: "Converting raw strings into executable commands. How minishell parsing works."
tags: [Dev, Project]
---

## Background

`echo "hello world" | wc -l > output.txt` — this string means nothing by itself. The shell must analyze and transform it into an executable structure.

![String → Execution: transformation flow](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/06_parsing_flow.png)

## Analysis

![Tokenizing rules](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/06_token_rules.png)

The key is state management — whether you're inside quotes changes how characters are processed.

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

## Reflection

"Converting unstructured input into structured data" shows up everywhere — compilers, API parsing, prompt design. The state-based approach was the key to stability.
