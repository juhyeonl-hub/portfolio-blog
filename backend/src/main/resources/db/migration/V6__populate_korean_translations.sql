-- V6: Populate Korean translations for existing posts.
-- Generated from journal/*.ko.md by tools/gen_v6_migration.py.
-- Uses tagged dollar quoting ($ko$...$ko$) so embedded markdown needs no escaping.

-- 01-why-agentic-engineering.ko.md  (slug: why-a-java-backend-developer-went-through-c-to-agentic-engineering)
UPDATE posts SET
    title_ko   = $ko$자바 백엔드 개발자가 C 언어를 거쳐 에이전틱 엔지니어링으로 간 이유$ko$,
    excerpt_ko = $ko$Spring Boot에서 C로, 다시 에이전틱으로. AI 시대에 한 층 아래의 레이어를 이해하는 일이 더 중요해진 이유.$ko$,
    content_ko = $ko$## 배경

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
$ko$
WHERE slug = 'why-a-java-backend-developer-went-through-c-to-agentic-engineering';

-- 02-c-memory-model.ko.md  (slug: understanding-the-c-memory-model-with-malloc-and-free)
UPDATE posts SET
    title_ko   = $ko$malloc과 free로 이해하는 C의 메모리 모델$ko$,
    excerpt_ko = $ko$GC가 없는 세상에서 메모리를 직접 관리한다는 것.$ko$,
    content_ko = $ko$## 배경

프로그램이 실행되면 OS는 메모리를 네 영역으로 나눈다.

![프로세스 메모리 레이아웃](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_structure.png)

스택은 자동으로 할당된다. 힙은 명시적인 malloc과 free를 요구한다. 자바에서는 GC가 처리해준다. C에는 GC가 없다.

## 분석

```c
int *arr = (int *)malloc(sizeof(int) * 10);
if (arr == NULL)
    return (-1);
arr[0] = 42;
free(arr);
```

상황이 복잡해지면 문제가 드러난다. ft_split에서 중간에 malloc이 실패하면, 앞서 할당했던 메모리를 모두 free하고 NULL을 반환해야 한다.

![자주 발생하는 메모리 버그](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/02_memory_bugs.png)

```bash
valgrind --leak-check=full ./program
```

## 회고

직접 해보고 나서야 GC가 "대신 해주는 일"이 정확히 무엇인지 알게 됐다. AI가 C 코드를 생성할 때 가장 흔한 실수는 에러 경로에서 free를 빠뜨리는 것 — 이 구조를 이해하지 못하면 그게 왜 문제인지 보이지조차 않는다.
$ko$
WHERE slug = 'understanding-the-c-memory-model-with-malloc-and-free';

-- 03-algorithm-constraints.ko.md  (slug: when-textbook-algorithms-break-against-real-constraints)
UPDATE posts SET
    title_ko   = $ko$교과서 알고리즘이 실제 제약 앞에서 깨질 때$ko$,
    excerpt_ko = $ko$push_swap에서 quicksort를 버리고 청크 기반 전략으로 간 과정.$ko$,
    content_ko = $ko$## 배경

push_swap — 두 개의 스택과 11개의 연산만 가지고 정렬한다. 제약: 100개 입력에 ≤700 연산, 500개에 ≤5500 연산.

![push_swap 가용 연산](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_operations.png)

## 분석

처음에는 quicksort를 시도했다. 스택은 임의 접근을 허용하지 않는다. 연산 횟수가 제약을 넘었다. 청크 기반 전략으로 다시 설계했다.

![청크 기반 정렬 과정](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_chunk_sort.png)

![접근 방식별 연산 횟수 비교](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/03_comparison.png)

## 회고

알고리즘 선택은 단순히 시간 복잡도의 문제가 아니다. 실제 환경에는 제약이 있다. AI는 일반적인 최적해를 알려주지만, 특정 제약에 맞춰 다시 설계하는 일은 사람의 판단 영역이다.
$ko$
WHERE slug = 'when-textbook-algorithms-break-against-real-constraints';

-- 04-unix-process-model.ko.md  (slug: understanding-the-unix-process-model-with-fork-and-pipe)
UPDATE posts SET
    title_ko   = $ko$fork()와 pipe()로 이해하는 Unix 프로세스 모델$ko$,
    excerpt_ko = $ko$ls | grep '.c' 뒤에서 일어나는 일. 프로세스 오케스트레이션의 기본.$ko$,
    content_ko = $ko$## 배경

`ls -l | grep ".c" | wc -l`을 입력하면, OS 안에서 세 개의 프로세스가 생성되고 파이프로 연결된다.

![핵심 시스템 콜](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/04_syscalls.png)

## 분석

![파이프라인 실행 흐름](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/04_pipeline.png)

핵심 규칙 — 사용하지 않는 파이프 끝은 반드시 닫아야 한다. 그러지 않으면 EOF가 절대 전송되지 않고 읽기 측 프로세스는 영원히 기다린다.

```c
int fd[2];
pipe(fd);

pid_t pid1 = fork();
if (pid1 == 0)
{
    close(fd[0]);
    dup2(fd[1], STDOUT_FILENO);
    close(fd[1]);
    execve("/bin/ls", args, env);
}

pid_t pid2 = fork();
if (pid2 == 0)
{
    close(fd[1]);
    dup2(fd[0], STDIN_FILENO);
    close(fd[0]);
    execve("/usr/bin/grep", args, env);
}

close(fd[0]);
close(fd[1]);
waitpid(pid1, NULL, 0);
waitpid(pid2, NULL, 0);
```

## 회고

프로세스를 만들고, 연결하고, 데이터를 넘기고, 완료를 기다린다. 이 패턴은 여러 AI 에이전트를 조율하는 에이전틱 시스템에 그대로 매핑된다.
$ko$
WHERE slug = 'understanding-the-unix-process-model-with-fork-and-pipe';

-- 05-deadlock-prevention.ko.md  (slug: why-deadlocks-happen-and-how-to-prevent-them)
UPDATE posts SET
    title_ko   = $ko$데드락은 왜 일어나고 어떻게 막는가$ko$,
    excerpt_ko = $ko$식사하는 철학자 문제에서 배우는 동시성 설계의 교훈.$ko$,
    content_ko = $ko$## 배경

N명의 철학자, N개의 포크. 모두가 동시에 왼쪽 포크를 잡는다. 아무도 오른쪽을 잡지 못한다. 데드락.

![식사하는 철학자 문제](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_philosophers.png)

![동시성 문제 유형](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/05_concurrency_types.png)

## 분석

해법 — 짝수 번호의 철학자는 오른쪽 포크를 먼저 잡는다.

```c
if (id % 2 == 0)
{
    pthread_mutex_lock(&forks[(id + 1) % N]);
    pthread_mutex_lock(&forks[id]);
}
else
{
    pthread_mutex_lock(&forks[id]);
    pthread_mutex_lock(&forks[(id + 1) % N]);
}
```

ThreadSanitizer로 검증. 수천 회 반복 실행.

## 회고

동시성은 "돌려보니 잘 되더라"가 아니다 — 증명 가능한 설계의 문제다. 이건 여러 에이전트가 동시에 공유 자원에 접근하는 멀티에이전트 시스템 설계로 그대로 이어진다.
$ko$
WHERE slug = 'why-deadlocks-happen-and-how-to-prevent-them';

-- 06-tokenizer-parser.ko.md  (slug: tokenizer-and-parser-structure)
UPDATE posts SET
    title_ko   = $ko$토크나이저와 파서의 구조$ko$,
    excerpt_ko = $ko$원시 문자열을 실행 가능한 명령으로 변환한다는 것 — minishell 파싱이 동작하는 방식.$ko$,
    content_ko = $ko$## 배경

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
$ko$
WHERE slug = 'tokenizer-and-parser-structure';

-- 07-cpp-vtable.ko.md  (slug: c-vtable-what-happens-when-you-add-virtual)
UPDATE posts SET
    title_ko   = $ko$C++ vtable — virtual을 붙이면 무슨 일이 일어나는가$ko$,
    excerpt_ko = $ko$동적 디스패치의 내부 구조와 다이아몬드 상속 문제.$ko$,
    content_ko = $ko$## 배경

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
$ko$
WHERE slug = 'c-vtable-what-happens-when-you-add-virtual';

-- 08-onboarding-strategy.ko.md  (slug: how-i-became-productive-in-one-month-without-documentation)
UPDATE posts SET
    title_ko   = $ko$문서 없이 한 달 만에 생산성을 낸 방법$ko$,
    excerpt_ko = $ko$현대캐피탈에서 배운 온보딩 전략. 재능이 아니라 — 방법.$ko$,
    content_ko = $ko$## 배경

현대캐피탈 첫 출근일. 사내 전용 프레임워크. 문서 없음. 온보딩 프로세스 없음.

## 분석

같은 프레임워크를 쓰는 다른 팀 사람들에게 직접 갔다. 핵심은 어떻게 묻느냐였다.

![질문 전략 비교](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/08_questions.png)

먼저 조사해서 가설을 세우고, 그 가설에 대한 확인을 부탁하는 방식.

![온보딩 전략 흐름](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/08_onboarding.png)

한 달 만에 완전히 생산성을 냈다. 프로젝트 리더가 다음 프로젝트에도 함께 가자고 제안했다.

## 회고

빠른 적응은 재능이 아니다 — 전략이다. "모르는 걸 인정하기"와 "아무것도 시도해보지 않은 채로 묻기"는 다르다. 전자는 신뢰를 쌓고, 후자는 신뢰를 깎는다.
$ko$
WHERE slug = 'how-i-became-productive-in-one-month-without-documentation';

-- 09-ai-first-workflow.ko.md  (slug: designing-an-ai-first-development-workflow-from-scratch)
UPDATE posts SET
    title_ko   = $ko$AI-first 개발 워크플로를 처음부터 설계하기$ko$,
    excerpt_ko = $ko$코드를 쓰는 일에서 — 지시하고, 판단하고, 검증하는 일로.$ko$,
    content_ko = $ko$## 배경

AI를 보조 도구로 쓰는 것 vs. 개발 루프 자체를 AI 중심으로 설계하는 것.

![전통적 워크플로 vs AI-first 워크플로](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/09_comparison.png)

## 분석

두 가지가 필요하다.

**첫째, 명확한 지시 능력.** 정확한 명세 작성이 곧 개발 능력 자체가 된다.

**둘째, 검증 능력.** AI가 생성한 코드가 맞는지 판단할 수 있어야 한다.

![AI 코드 검증 체크리스트](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/09_checklist.png)

![AI-first 개발 루프](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/09_ai_loop.png)

## 회고

AI-first 개발은 개발자에게 더 많은 것을 요구한다, 덜이 아니라. 전체 설계를 머릿속에 들고 있어야 하고, 결과물의 품질을 판단해야 하고, 무엇이 정확히 잘못됐는지 짚어낼 수 있어야 한다. AI 시대 개발자의 가치는 좋은 코드와 나쁜 코드를 구분하는 능력 — 그리고 그 능력은 기초에서 나온다.
$ko$
WHERE slug = 'designing-an-ai-first-development-workflow-from-scratch';

-- 10-agentic-engineering.ko.md  (slug: whats-different-when-a-systems-programmer-does-agentic-engineering)
UPDATE posts SET
    title_ko   = $ko$시스템 프로그래머가 에이전틱 엔지니어링을 할 때 무엇이 달라지는가$ko$,
    excerpt_ko = $ko$Unix 프로세스 모델에서 에이전틱 시스템으로 — 시리즈의 마지막 글.$ko$,
    content_ko = $ko$## 배경

에이전틱 엔지니어링 — 여러 AI 에이전트가 각자의 역할을 수행하고 결과를 결합해 더 큰 작업을 완성하는 시스템 설계.

## 분석

![시스템 프로그래밍 → 에이전틱 매핑](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/10_mapping.png)

![프로세스 파이프라인 vs 에이전틱 파이프라인](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/10_pipeline.png)

셸이 하는 일 — 프로세스를 만들고, 파이프로 연결하고, 데이터 흐름을 관리하고, 실패를 처리하는 일 — 은 에이전틱 오케스트레이터가 하는 일과 정확히 같다.

동시성도 직접 적용된다. 여러 에이전트가 같은 데이터에 동시에 접근하면 충돌이 생긴다. 5번 글의 문제와 동일하다 — 다만 mutex 대신 큐가 등장할 뿐.

파서 설계도 연결된다. LLM에 프롬프트를 넣는 일은 "비정형 자연어를 정형 명령으로 변환"하는 일 — 6번 글의 사고방식이 그대로다.

## 회고

에이전틱 엔지니어링은 완전히 새로운 분야가 아니다. 한 단계 높은 추상에서 다시 등장한 시스템 프로그래밍의 개념들이다.

프로세스 오케스트레이션을 이해하는 사람은 에이전트 오케스트레이션을 더 잘 설계한다. 동시성 문제를 겪어본 사람은 멀티에이전트 충돌을 더 잘 막는다. 메모리를 직접 관리해본 사람은 컨텍스트 관리를 더 잘 다룬다.

기초가 단단할수록 그 위에서 할 수 있는 일의 폭이 넓어진다. 이 시리즈가 하고 싶었던 모든 말이다.
$ko$
WHERE slug = 'whats-different-when-a-systems-programmer-does-agentic-engineering';

-- 11-agentic-engineering-part1.ko.md  (slug: agentic-engineering-with-orchestration-part-1)
UPDATE posts SET
    title_ko   = $ko$오케스트레이션 기반 에이전틱 엔지니어링 (Part 1)$ko$,
    excerpt_ko = $ko$멀티에이전트 시스템 만들기 — 왜 골격부터 시작했고, 작업하는 내내 반복해서 떠올랐던 설계 원칙들.$ko$,
    content_ko = $ko$요즘 에이전트 시스템을 공부하고 있다. "LLM API에 프롬프트를 던지고 응답을 받는" 수준을 넘어 — 여러 에이전트가 협업하고, 판단하고, 도구를 쓰는 구조. 그런 시스템을 어떻게 설계해야 하는지 감을 잡아가는 중이다.

이 첫 글은 **프로젝트의 골격을 어떻게 잡았는지**, 그리고 그 과정에서 반복해서 떠올랐던 설계 원칙들에 관한 이야기다. 에이전트 로직 자체는 다음 글부터 시작한다.

---

## 왜 구조부터 시작했나

처음에는 "LangGraph 예제부터 그대로 따라가자"고 생각했다. 그런데 프로젝트 목표를 다시 들여다보니 방향을 바꿔야 했다.

- 학습용 프로젝트지만 포트폴리오로도 쓸 것이다
- 여러 LLM을 실험하고 비교해보고 싶다
- 개발 중에는 무료로 돌릴 수 있어야 하고, 나중에는 상용 모델로 갈아끼울 수 있어야 한다

이 세 가지를 만족시키려면 가장 먼저 필요한 건 **특정 LLM 공급자에 묶이지 않는 구조**였다. 모델을 바꿀 때마다 에이전트 로직을 손대야 한다면 실험도, 비교도 부담이 된다.

---

## LangChain과 LangGraph

두 라이브러리의 역할을 정리하는 일이 먼저였다.

**LangChain**은 LLM 기반 앱을 만들 때 반복적으로 등장하는 조각들을 모아놓은 기초 블록이다. 모델 래퍼, 프롬프트 템플릿, 출력 파서, 도구 바인딩, 메모리 등. 핵심은 **다양한 공급자를 단일 인터페이스로 호출할 수 있도록 추상화**한다는 점이다.

**LangGraph**는 그 위에 **그래프 기반 워크플로**를 짜는 프레임워크다. 에이전트는 단순 순차 실행이 아니라 — "판단 → 행동 → 관찰 → 다시 판단"의 루프다. LangGraph는 이걸 노드와 엣지, 조건 분기, 상태 관리로 표현한다.

비유하자면 — LangChain은 레고 블록이고, LangGraph는 그 블록으로 만들어내는 복잡한 기계의 설계도다. 이번 프로젝트는 LangGraph를 중심에 두고, 안쪽 모델 호출은 LangChain의 통합 인터페이스를 활용하기로 했다.

---

## Provider Factory 패턴

LangChain은 공급자별 어댑터(langchain-anthropic, langchain-google-genai, langchain-groq 등)를 제공하고, 모두 `BaseChatModel`이라는 공통 인터페이스를 구현한다. 이걸 활용해 모델 생성 로직을 한 곳에 모았다 — **Factory 패턴**.

```python
def get_llm(provider=None, temperature=0.7, max_tokens=1024) -> BaseChatModel:
    provider = (provider or Config.LLM_PROVIDER).lower()

    if provider == "gemini":
        return ChatGoogleGenerativeAI(model=..., temperature=..., ...)
    elif provider == "groq":
        return ChatGroq(model=..., temperature=..., ...)
    elif provider == "claude":
        return ChatAnthropic(model=..., temperature=..., ...)
    else:
        raise ValueError(f"Unsupported provider: {provider}")
```

호출하는 쪽은 구체 클래스를 알 필요가 없다.

```python
llm = get_llm()
response = llm.invoke("a question")
```

설정값 하나만 바꾸면 내부적으로 Gemini, Groq, Claude 사이를 오간다. 에이전트 로직은 한 줄도 바뀌지 않는다.

---

## 이 구조가 왜 중요한가

"편하니까"를 넘어 몇 가지 이유가 있다.

**관심사 분리.** 모델 생성 로직이 한 곳에 모이면, 비즈니스 로직(에이전트가 어떻게 판단하고 협업하는가)이 인프라 로직(어떤 모델을 쓰는가)과 섞이지 않는다. 각자 독립적으로 진화할 수 있다.

**테스트 가능성.** 호출자가 구체 클래스가 아니라 인터페이스에 의존하면, 실제 API를 치지 않는 가짜 LLM을 주입해 테스트할 수 있다. 개발 속도와 테스트 비용이 동시에 관리 가능해진다.

**확장성.** 새로운 공급자가 등장하면 Factory 함수만 수정하면 된다. 호출 지점 수십 군데를 뒤져 분기를 추가할 필요가 없다.

**실용적 이점.** 무료 티어 Gemini/Groq로 개발을 끝내고, 프로덕션급 품질이 필요할 때만 상용 모델로 갈아끼운다 — 코드 변경 없이, 설정 한 줄로.

---

## 성능 차이를 직접 느껴보다

같은 프롬프트로 세 공급자의 응답 시간을 비교해봤다.

| Provider | Model | Response Time |
|---|---|---|
| Gemini | gemini-2.5-flash | 1.33s |
| Groq | llama-3.3-70b-versatile | 0.41s |
| Claude | claude-sonnet-4-5 | - (측정 안 함) |

Groq이 눈에 띄게 빠르다 — 전용 LPU 하드웨어 위에서 돌아간다. 반면 Gemini 2.5 Pro와 Claude는 모델 품질에서 우위가 있다. 이런 차이를 알면 상황별로 골라 쓸 수 있다 — 속도가 중요한 대화형 UI에는 Groq, 복잡한 추론에는 Gemini Pro나 Claude, 균형 잡힌 기본값으로는 Gemini Flash.

---

## 설계 원칙, 정리

오늘 작업하면서 반복해서 떠올랐던 원칙들.

**추상화는 비용이 아니라 투자다.** 처음에는 `ChatGoogleGenerativeAI(...)`를 직접 부르는 쪽이 한 줄 짧다. 하지만 호출 지점이 늘어나면 변경 비용이 폭발한다. Factory를 미리 만들어두면 결국에는 이득이다.

**구현이 아니라 인터페이스에 의존하라.** 호출자는 `ChatAnthropic`이 아니라 `BaseChatModel`만 알면 된다. 그게 공급자 비종속 아키텍처의 핵심이다.

**설정은 코드 바깥에 둬라.** 어떤 모델을 쓸지, 어떤 키를 쓸지 — 이런 건 환경별 설정에 들어가야 한다, 코드가 아니라. 같은 코드가 dev와 prod에서 다르게 동작해야 한다.

**검증을 자동화하라.** 설정이 유효한지, 각 공급자가 실제로 응답하는지를 확인하는 별도 스크립트를 두면, 무언가 깨졌을 때 어느 레이어가 문제인지 빠르게 찾을 수 있다.

---

## 다음

골격을 잡았으니, 다음은 실제 에이전트 로직이다. LangGraph의 노드와 엣지로 단일 에이전트를 만들고, 그 다음 여러 에이전트가 협업하는 Supervisor 패턴으로 확장할 예정이다. 가는 길에 상태 관리, 조건부 라우팅, 도구 호출을 실제 코드 안에서 다루게 된다.

흥미로운 건 — 같은 원칙이 계속 반복된다는 점이다. 에이전트의 역할도 인터페이스 뒤로 추상화될 거고, 오케스트레이션 로직은 개별 에이전트 구현을 알면 안 된다. 모델 공급자에 적용했던 원칙이 한 층 위에서 다시 등장한다.

Part 2에서 계속.
$ko$
WHERE slug = 'agentic-engineering-with-orchestration-part-1';

-- 12-agentic-engineering-part2.ko.md  (slug: agentic-engineering-with-orchestration-part-2)
UPDATE posts SET
    title_ko   = $ko$오케스트레이션 기반 에이전틱 엔지니어링 (Part 2)$ko$,
    excerpt_ko = $ko$첫 LangGraph 에이전트 만들기 — 가장 단순한 ReAct 루프, 그리고 그래프는 완벽히 동작했는데도 에이전트가 검색을 거부했던 순간.$ko$,
    content_ko = $ko$Part 1에서 프로젝트 골격과 설계 원칙을 정리했다. 이번 글은 LangGraph로 첫 에이전트를 실제로 만드는 이야기다 — 검색 도구 한 개를 가진 단일 LLM, 가장 단순한 형태의 ReAct 루프. 코드는 짧지만, 만드는 과정에서 예상보다 많은 게 드러났다.

## 만들고 싶었던 것

질문을 받고, 필요할 때 웹 검색을 하고, 신선한 정보로 답하는 에이전트. 네 가지 개념이 머리에 박혀야 했다.

- **State**: 한 번의 실행 동안 누적되는 메시지 기록
- **Node**: state를 읽고 업데이트를 반환하는 함수
- **Edge**: 노드 사이의 연결 (무조건 또는 조건부)
- **ReAct loop**: think → act → observe, 끝날 때까지 반복

## State 정의가 처음에 이상하게 보이는 이유

가장 오래 끌린 한 줄.

```python
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
```

기본적으로 LangGraph는 업데이트가 들어올 때마다 state 필드를 덮어쓴다. 노드가 `{"messages": [new_message]}`를 반환하면, 메시지 리스트 전체가 교체된다. 그런데 대화형 에이전트는 history가 누적돼야 한다. `add_messages` reducer가 LangGraph에게 알려준다 — 덮어쓰지 말고, append해라.

파이썬의 `Annotated`는 원래 타입에 메타데이터를 붙이는 수단이었다. LangGraph는 그걸 state 업데이트 규칙을 전달하는 채널로 재활용한다. 처음엔 이상해도, 한 번 이해되면 깔끔하다 — 결합 규칙이 필드 선언 바로 옆에 산다.

## LLM이 도구를 "안다"는 게 무슨 뜻인가

`llm.bind_tools([search_tool])`이 핵심 한 줄이다.

LLM은 도구를 등록해주지 않으면 그게 존재하는지조차 모른다. 바인딩이 끝나면 응답이 두 가지 형태 중 하나로 들어온다 — 일반 텍스트, 또는 `tool_calls` 필드에 "이 도구를 이 인자로 호출해라"는 구조화된 신호가 담긴 `AIMessage`. 프레임워크가 그걸 잡아 도구를 실행하고, 결과를 다시 모델에 먹인다.

흥미로운 건 — **LLM 자신이 도구를 호출할지 말지를 결정한다는 점이다.** "쿼리에 X가 들어가면 검색해라"를 하드코딩하지 않는다. 모델의 판단을 신뢰한다. 이 신뢰가 그날의 핵심 이슈가 됐다.

## 그래프 조립

```
START → agent → (conditional) → tools → agent → ... → END
```

`agent` 노드가 끝날 때마다 LangGraph가 마지막 메시지를 본다. 도구 호출이 있으면 → `tools`로 라우팅. 없으면 → `END`. 내장된 `tools_condition`이 그 검사를 처리한다. `tools` 실행 후에는 다시 `agent`로 돌아오고, LLM은 답을 마무리하거나 다시 검색을 요청한다. 이 사이클이 ReAct 루프의 가장 단순한 형태다.

## 첫 실행 — 그리고 예상 못한 거부

질문: *"What's the latest Claude model Anthropic released in 2026?"*

답:

> "I'm sorry, but I can't retrieve information about 2026. At the current point in time, 2026 is in the future, so those events haven't happened yet."

**검색을 아예 하지 않았다.** LLM이 "2026 = 미래"라고 판단하고 도구를 호출하지 않은 채 종료해버렸다.

내 그래프는 설계대로 정확히 동작했다. 문제는 **LLM이 지금이 언제인지 전혀 모른다는 것**이었다. 학습 컷오프 이후의 모든 것이 "미래"로 보인다. 셋업 어디에도 그렇지 않다고 알려주는 게 없었다.

## 해법 — 시스템 프롬프트

코드 변경 없음. 프롬프트만 바꿨다.

```python
SYSTEM_PROMPT = """You are a research agent that answers using web search.

Current date: April 22, 2026

# Operating principles
1. Your training data may be outdated. For current information, use TavilySearch
   before answering.
2. If a date in the question is before the current date, it's the PAST, not the
   future — it's searchable. Try searching before saying "I don't know."
"""
```

`agent_node` 안에서 매 LLM 호출마다 `SystemMessage`로 앞에 붙였다. 같은 질문 두 번째 실행 — 에이전트가 Tavily를 호출하고, 실제 결과를 받아 "Claude Opus 4.7, released April 9, 2026"이라고 답했다. 출처와 함께. 같은 코드, 다른 프롬프트.

## 여기서 배운 것

**구조적 정확성 ≠ 행동적 정확성.** 그래프가 흠 없어도 에이전트가 원하는 대로 안 움직일 수 있다 — 그래프와 프롬프트는 서로 다른 두 레이어다. 그래프는 무엇이 *가능한지*를 정의하고, 프롬프트는 매 LLM 호출 안에서 *실제로 무엇이 일어나는지*를 형성한다.

특히 놀라웠던 건 — *지금이 몇 년인지* 같은 배경 컨텍스트조차 명시적으로 말해줘야 한다는 점이다. LLM은 시간 감각을 스스로 들고 있지 않다. "지금"에 의존하는 행동을 원하면, "지금"을 주입해야 한다.

한 가지 더 — 시스템 프롬프트를 State 안에 넣지 않았다. 노드 함수 안에서 매 호출 시 앞에 붙인다. 그게 정체성(시스템 프롬프트)과 메모리(대화 history)를 분리해둔다. 둘은 다른 시간 척도에 살고, 아마 다른 곳에 있어야 한다.

## 처음부터 가드레일

학습용 프로젝트라도 미리 깔아둘 만한 안전장치 몇 가지.

- `recursion_limit=10` — 크레딧이 타기 전에 폭주 루프를 잡는다
- `temperature=0` — 디버깅 쉬운 결정론적 출력
- `max_tokens=1024` — 한 번의 생성 길이 제한
- 그래프 실행 전 키 검증

이 검증이 즉시 효과를 봤다. 첫 실행이 HTTP 스택 깊은 곳에서 `UnicodeEncodeError`로 죽었다. 원인 — `.env`에 실제 키 대신 한국어 placeholder를 그대로 둔 거였다. HTTP 헤더는 ASCII만 받기 때문에, 비-ASCII 문자가 인코딩 시점에 폭발했다. 미리 검증을 해두니, 이게 스무 줄 스택 트레이스 대신 한 줄 에러가 됐다.

## 다음

Part 3에서는 **supervisor + 멀티에이전트 오케스트레이션**으로 넘어간다. 오늘 만든 에이전트를 빌딩 블록으로 삼아서, researcher / analyst / writer 에이전트가 따로따로 있는 시스템을 supervisor가 라우팅하게 만든다. 그 과정에서 단일 에이전트로 충분한 지점은 어디인지, 오케스트레이션 비용이 정말 정당화되는 지점은 어디인지를 같이 들여다볼 생각이다.

*To be continued.*
$ko$
WHERE slug = 'agentic-engineering-with-orchestration-part-2';

-- 13-treating-ai-as-collaborator.ko.md  (slug: treating-ai-as-a-collaborator-not-a-tool)
UPDATE posts SET
    title_ko   = $ko$AI를 도구가 아니라 협업자로 다루기$ko$,
    excerpt_ko = $ko$Claude Code와 일하는 방식, 그리고 모델보다 루프가 더 중요한 이유.$ko$,
    content_ko = $ko$*Claude Code와 일하는 방식, 그리고 모델보다 루프가 더 중요한 이유.*

## 빠르게 분명해진 두 가지

Claude Code를 진지하게 쓰기 시작했을 때, 두 가지가 아주 빠르게 분명해졌다.

첫째 — AI는 진심으로 손으로 따라가기 어려운 속도로 코드를 만들어낸다.

둘째 — 그 코드는 생각보다 자주 엉뚱한 방향으로 간다.

스펙에서 미끄러진다. 잘못된 아키텍처를 고른다. *그럴듯해* 보이는데 실제 의도를 비껴가는 코드를 내놓는다. 한동안은 에이전트를 따라다니며 치우는 데 더 많은 시간을 썼다 — 직접 짜는 게 빠른 날도 있었다.

긴 기간 그것과 싸우다가 일하는 방식을 바꿨다. 이 글은 그 워크플로의 기록이다. 대부분은 [Opiter](https://github.com/juhyeonl-hub/opiter)라는 오픈소스 데스크톱 문서 워크벤치를 만들면서 형태를 잡았다.

## 원칙 — 사람이 결정하고 에이전트가 실행한다

AI 보조 개발에서 가장 흔한 실수는 **에이전트에게 결정을 넘기는 것**이다. "이 기능 만들어줘"라고 하면 에이전트는 어디론가 달려간다. 그 방향이 내 방향과 일치하리라 기대할 근거는 없다.

내 워크플로는 그걸 뒤집는다. **결정은 내가 한다. 에이전트는 실행한다.** 그리고 결정은 코드를 만지기 *전에* 글로 적어둔다.

이게 한 줄 요약이다. 실제로 어떻게 굴러가는지 풀어보면 이렇다.

## Phase 1 — 셋업: 코드 전에 스펙

새 프로젝트를 시작할 때 코드를 쓰지 않는다. 에이전트에게 코드를 요청하지도 않는다. 가장 먼저 에이전트에게 넘기는 건 운영 규칙 세트다.

이 규칙들은 에이전트가 어떻게 행동해야 하는지를 기술한다 — 자동으로 해도 되는 일, 명시적 승인이 필요한 일, 실패를 어떻게 다룰지, 알리지 않고 절대 해서는 안 되는 일. 이 규칙을 만드는 데 오래 걸렸지만, 일단 만들어두면 모든 프로젝트에서 재사용한다. 자주 바뀌지 않는 자산이다.

규칙이 자리 잡으면 에이전트는 정해진 질문 세트를 묻는다. 이 프로젝트의 최종 목표는? 어떤 스택, 어떤 환경? 주요 기능은? *완료*는 어떻게 정의되나 — "빌드 통과"가 아니라 실제로 검증 가능한 출력으로?

내가 답한다. 그러면 에이전트가 답을 바탕으로 `PROJECT_BRIEF.md`를 생성한다. 그 문서가 프로젝트의 source of truth가 된다. 코드가 아니라 — 브리프가. 브리프와 코드가 다를 때, 잘못된 건 코드다.

![워크플로 — 아이디어에서 v1.0까지](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/13_workflow.svg)

## Phase 2 — 실행 루프

브리프가 생기면 워크플로는 단순하다. 단순함이 핵심이다.

에이전트는 **한 번에 한 단계씩** 작업한다. 한 단계를 시작하기 전에 세 가지를 해야 한다.

- 그 단계의 목표를 한 줄로 진술한다.
- 어떤 파일과 함수가 작업 범위인지 정확히 정의한다.
- 기대 입출력과 실패 모드를 적는다.

이걸 끝낸 다음에야 코드를 만진다.

이 세 단계는 종이 위에서 사소해 보인다. 실제로는 — 잘못된 방향이 가장 많이 잡히는 지점이다. 에이전트가 무엇을 하려는지 입 밖으로 말해야 할 때, 천 줄을 생성해 내가 다 버려야 하기 전에 스스로 잡아낸다.

단계가 끝나면 에이전트는 빌드하고, 코드를 실행하고, 결과를 검증한다. "맞아 보인다"는 통하지 않는다. 실제 실행 결과가 있어야 한다. 그러고 나서 자가 검증 보고서를 만든다 — 무엇을 테스트했고, 어떤 입력을 썼고, 어떤 출력을 관찰했고, 무엇을 *테스트하지 *않았는지*. 정직한 갭까지 포함해서.

내 손이 필요 없으면 에이전트가 다음으로 넘어간다. 필요하면 — UI 변경이라든가, 사람 눈이 필요한 흐름이라든가 — 에이전트가 테스트 케이스를 건넨다. 내가 실행해서 출력을 보고 다음을 정한다 — 뭘 고치든지, 다음으로 가든지, 기능 추가를 멈추고 지금 동작하는 걸로 프로토타입을 출시하든지.

## Phase 3 — 실패 처리: 고치기 전에 분류한다

실패가 나면 즉시 고치기로 가지 않는다. 가장 오래 배워야 했던 규칙이다.

뭔가 깨지면 에이전트의 본능은 고치기 시작하는 것이다. 그게 나선이 시작되는 방식이다 — 잘못된 진단 위에 잘못된 수정, 그 위에 무관한 증상. 내가 알아챘을 때쯤이면 부분적으로 적용된 수정 세 겹이 엉켜 있고, 원래 문제는 보이지 않는다.

그래서 실패는 먼저 분류된다.

![실패 처리 — 고치기 전에 분류한다](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/13_failure.svg)

실패가 외부 신호를 보이면 — 네트워크 에러, 환경 불일치, 의존성 이슈, 모델 한도 — 에이전트는 코드를 바꾸지 않은 채 한 번 재시도한다. 풀리면 일시적이었던 거고 로그로 남긴다. 풀리지 않으면 멈추고 보고한다.

외부 신호가 없으면 실패는 내부다. 에이전트가 한 줄로 원인을 진술한다. 그 다음 *그* 원인을 짚는 수정을 고른다. 그리고 — 가장 중요한 규칙은 — 같은 수정 방법을 두 번 쓰지 않는다. 수정이 안 통했다면 진단이 틀린 거다. 반복해도 결과는 바뀌지 않는다.

이 한 번의 분류 단계가 에이전트의 나선을 막는다. 매 재시도마다 핑 받는 대신, 내가 실제로 개입해야 할 때를 깔끔하게 신호로 받게 된다.

## 이렇게 하면 무엇을 얻는가

이걸 일관되게 하면 결과는 Opiter 같은 것이 된다 — 파이썬과 PySide6로 만든 PDF·DOCX 워크벤치 v0.1 릴리스. 가지고 있는 기능은 안정적으로 가지고 있고, 자가 검증된 테스트 경로가 있다. 가지지 않은 기능은 조용히 깨진 게 아니라 — 문서화돼 있다.

같은 워크플로가 [juhyeonl.dev](https://juhyeonl.dev)도 만들었다. 같은 루프, 완전히 다른 스택과 제품 도메인. 패턴이 옮겨간다.

## 실제로 배운 것

전에는 "AI 보조 개발"이라는 게 AI가 핵심이라고 생각했다. 아니다.

이런 종류의 일을 견고하게 만드는 건 엔지니어가 에이전트 주위에 짜는 루프다. 명확한 스펙. 검증 가능한 작은 단계들. 의무적인 리뷰. 에이전트가 자기 실수를 덮지 못하게 막는 실패 처리 규칙.

이 모든 게 자리 잡으면, 에이전트는 더 이상 내가 쫓아다니며 치우는 대상이 아니다. 진짜 엔지니어링 협업자처럼 행동하기 시작한다 — 다만 사람보다는 훨씬 더 강하게 몰아붙이는.

지금 일하는 방식이다.

---

**프로젝트:**
- Opiter — [github.com/juhyeonl-hub/opiter](https://github.com/juhyeonl-hub/opiter)
- 포트폴리오 — [juhyeonl.dev](https://juhyeonl.dev)
$ko$
WHERE slug = 'treating-ai-as-a-collaborator-not-a-tool';

-- 14-agentic-engineering-part3.ko.md  (slug: agentic-engineering-with-orchestration-part-3)
UPDATE posts SET
    title_ko   = $ko$오케스트레이션 기반 에이전틱 엔지니어링 (Part 3)$ko$,
    excerpt_ko = $ko$ReAct 에이전트에 도구 두 개를 더 붙이고 — 함수 이름이 docstring보다 LLM에게 도구를 더 잘 설명한다는 사실을 발견하기까지.$ko$,
    content_ko = $ko$## 왜 멀티툴인가

Part 2에서 만든 ReAct 에이전트는 검색 도구 하나만 가진 단출한 친구였다. 질문하면 Tavily로 검색하고, 결과 스니펫을 읽고 답변하는 식. 잘 동작했지만 한계도 명확했다 — 스니펫이 짧으면 답변도 얕았고, "최신"이라는 단어가 들어간 질문에는 학습 시점 기준의 낡은 답을 내놓을 때가 있었다.

그래서 Part 3에서는 도구를 두 개 더 붙여 봤다. 멀티툴 환경에서 에이전트가 어떻게 도구를 골라 쓰는지가 궁금했고, 그 과정에서 "도구를 LLM에게 어떻게 설명해야 잘 쓰는가"라는 질문에 답을 얻고 싶었다.

## 무엇을 만들었나

`03_agent_with_tools.py`. Part 2의 그래프 골격은 그대로 두고, 도구만 1개 → 3개로 늘렸다.

- **`get_current_date`** — 오늘 날짜를 `YYYY-MM-DD`로 반환. "최신", "현재", "지금" 같은 시간성 질문이 들어오면 먼저 이걸 호출하고, 연도를 검색 쿼리에 끼워 넣게 만들었다.
- **`fetch_url`** — 검색 결과의 URL을 받아서 본문을 추출. `requests`로 받아 `BeautifulSoup`으로 `script`/`style`/`nav`/`footer` 같은 노이즈를 걷어내고, 5000자에서 자르고, 타임아웃·HTTP 에러를 깔끔한 메시지로 리턴.
- 시스템 프롬프트에 "언제 어떤 도구를 부를지", "fetch_url은 1~2개만"이라는 협력 규칙 추가.

```python
@tool
def get_current_date() -> str:
    """Returns today's date in YYYY-MM-DD format.

    Use this whenever the user asks about "latest", "recent", "current",
    or anything time-sensitive. Knowing today's date helps you formulate
    better search queries (e.g., adding the year to find truly recent info).
    """
    return datetime.now().strftime("%Y-%m-%d")
```

이 코드 자체는 평범하다. 진짜 흥미로운 건 따로 있었다.

## graph.stream()으로 행동을 들여다보다

`graph.invoke()`만 쓰면 최종 답변만 보인다. 그런데 멀티툴이 되니까 "이 녀석이 도구를 어떤 순서로, 몇 번이나 호출하는지"가 궁금해졌다. 그래서 `graph.stream()`으로 매 노드의 출력을 실시간으로 찍어봤다.

```python
for chunk in graph.stream(...):
    for node_name, node_output in chunk.items():
        last_msg = node_output["messages"][-1]
        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            for tc in last_msg.tool_calls:
                print(f"tool call: {tc['name']}, args: {tc['args']}")
```

질문은 *"Tell me about Anthropic's latest Claude model, Opus 4.7, and its key improvements."*

에이전트는 다음 순서로 움직였다:

1. `get_current_date` — 오늘 날짜로 시간 기준 잡기
2. `tavily_search`, 연도까지 끼워서: `"Claude Opus 4.7 2026"`
3. `fetch_url`로 가장 권위 있는 결과의 본문
4. `fetch_url`을 한 번 더, 두 번째 권위 있는 출처에

내가 시스템 프롬프트에 적은 작동 원칙 그대로였다. "보인다"는 게 강력했다. 디버깅이라기보단 — 머릿속에 있던 "에이전트가 추론한다"는 추상이 구체적인 실행 시퀀스로 바뀌는 순간이었다.

## 진짜 발견 — 함수 이름이 docstring을 이긴다

여기서 멈출 수도 있었지만, 한 가지 가설을 시험해보고 싶었다 — **"docstring을 망가뜨리면 LLM이 헷갈릴까?"**

> 잠깐 — *docstring*이 뭐냐면, 파이썬 함수 정의 바로 아래에 `"""..."""`로 감싸 적어두는 설명문이다. 사람이 읽기 위한 문서이기도 하지만, LangChain의 `@tool` 데코레이터는 이 docstring을 읽어서 LLM에게 "이 도구가 뭐 하는 건지" 설명하는 데 그대로 사용한다. 그러니까 docstring을 잘 쓰는 게 "LLM에게 도구를 잘 설명하는 일"과 같다고 — 적어도 처음엔 — 그렇게 믿고 있었다.

3차에 걸쳐 같은 질문, 같은 도구 구성, docstring과 시스템 프롬프트만 점진적으로 부숴봤다.

| 실험 | docstring          | 시스템 프롬프트       | 내 예상              | 실제 결과            |
|:---:|:-------------------|:----------------------|:---------------------|:---------------------|
| 1차 | 풍부               | 풍부                  | 잘 동작할 것         | 도구 4회, 깊이 있는 답변 |
| 2차 | `"Fetches a URL."` | 풍부                  | 약간 헤맬 것         | **동일**             |
| 3차 | `"Fetches a URL."` | `"Fetches a URL"`     | 도구 선택 실패할 것  | **동일**             |

예상은 빗나갔다. docstring을 한 줄로 줄이고 시스템 프롬프트를 거의 빈 껍데기로 만들어도, Claude Haiku 4.5는 `fetch_url(url: str)`이라는 **시그니처만 보고** 정확히 같은 시점에 같은 도구를 불렀다.

이게 우연이 아니었다는 게 핵심이다. 함수 이름과 타입 힌트만으로 LLM은 이미:

- "이 함수는 URL을 가져오는 거구나"
- "검색 결과 다음에 부르는 게 자연스럽겠다"

까지 추론하고 있었다. docstring과 시스템 프롬프트는 **이미 추론된 결과를 보강하는 정도**였던 거다.

### 그래서 얻은 디자인 원칙

이걸로 도구 설계할 때 머릿속 우선순위가 정리됐다.

![LLM이 도구를 이해하는 네 가지 신호](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/14_signal_hierarchy.svg)

1. **함수 이름이 1차 신호다.** `fetch_url`, `get_current_date`처럼 동사+명사로 의도가 한 번에 보이게. `do_thing` 같은 이름은 LLM에게도 사람에게도 똑같이 나쁘다.
2. **타입 힌트는 인자 이해의 결정타다.** `url: str` 한 줄이 "이건 URL 문자열을 받는다"를 확정한다.
3. **docstring은 함수 이름으로 표현 못 하는 것을 위한 것이다.** "언제 호출하지 마라", "1~2개만 호출해라" 같은 *제약*이나 *호출 시점*. 함수가 뭐 하는지를 다시 설명하는 docstring은 토큰 낭비다.
4. **시스템 프롬프트는 도구 *간*의 협력 규칙이다.** 단일 도구의 사용법이 아니라 "검색 → 본문 → 답변" 같은 다단계 흐름.
5. 이 셋이 **중복돼 있을 때 가장 견고하다.** 한 신호가 약해도 다른 신호가 메꾼다. 다중 방어선.

## Part 3 끝나는 시점에서

처음 이 시리즈를 시작할 때 "에이전틱 엔지니어링 시스템을 만든다"고 거창하게 말했지만, 솔직히 인정해야 할 것 같다 — 지금 만들고 있는 건 **에이전트 1개**다. 시스템이라고 부를 만한 무언가는 한참 멀었다.

그래도 부품을 만들 줄 아는 능력은 쌓이고 있다. State, ReAct 루프, 멀티툴, stream 관찰. 정원처럼 봐야 한다고 생각했다 — 한 번에 큰 설계를 끝내는 게 아니라, 식물 하나씩 심으면서 키워가는 것.

## 다음

도구를 더 늘리는 것보다 중요한 건 — **메모리**다. 지금 에이전트는 한 번 답하고 끝이다. 후속 질문이 들어오면 처음부터 다시 검색한다. 짧은 대화 컨텍스트라도 유지할 수 있다면 — 그리고 검색 결과를 캐싱할 수 있다면 — 같은 정원에 두 번째 화분이 놓이는 셈이다.

*To be continued.*
$ko$
WHERE slug = 'agentic-engineering-with-orchestration-part-3';

-- 15-agentic-engineering-part4.ko.md  (slug: agentic-engineering-with-orchestration-part-4)
UPDATE posts SET
    title_ko   = $ko$오케스트레이션 기반 에이전틱 엔지니어링 (Part 4)$ko$,
    excerpt_ko = $ko$한 멀티툴 에이전트를 supervisor 아래 세 명의 전문가로 쪼개고 — 같은 걸 두 번 만들어보면서, 라이브러리가 무엇을 가려놨는지 들여다보기.$ko$,
    content_ko = $ko$Part 3에서는 단일 에이전트의 도구 목록을 셋으로 늘렸다. 이번에는 그 한 명의 멀티툴 에이전트를 **세 명의 전문 에이전트**로 쪼개고 그 위에 supervisor를 얹었다. 같은 걸 두 가지 방식으로 만들었다 — 한 번은 라이브러리로, 한 번은 손으로 — 그 비교가 결국 핵심 교훈이 됐다.

## 왜 단일 에이전트를 쪼개는가

Part 3까지의 에이전트는 검색도 하고, 분석도 하고, 직접 글도 썼다. 짧은 질문엔 충분했지만, 한 명에게 모든 역할을 맡기면 시스템 프롬프트가 늘어진다 — *"너는 검색도 잘하고 분석도 잘하고 글도 잘 쓰는…"* — 그러면 모델이 어느 모드에 있는지 흐릿해진다. 출력 톤이 흔들리고, 뭔가 잘못됐을 때 "어느 단계가 문제였지?"는 쉽게 답할 수 있는 질문이 아니다.

해법은 **관심사 분리**다. 한 명의 만능 프리랜서 대신, 세 명의 전문가를 고용한다.

- `researcher`: 웹 검색과 본문 수집만. Part 3의 도구 셋(`web_search`, `get_current_date`, `fetch_url`)을 그대로 물려받는다.
- `analyst`: 수집된 자료에서 패턴, 모순, 출처 신뢰도를 정리. 도구 없음, 추론만.
- `writer`: 분석을 받아 마크다운 보고서로 작성. 도구 없음.

각자의 시스템 프롬프트는 짧고 한 가지에만 집중한다. 그 위에 누구를 부를지 정하는 `supervisor`가 앉는다.

## 같은 걸 두 가지 방식으로 만들기

같은 시스템을 일부러 두 번 만들었다 — 한 번은 라이브러리로(Version A), 한 번은 `StateGraph`로 손으로(Version B). 동작은 같은데, 가르쳐주는 게 다르다.

![두 가지 라우팅 메커니즘이 있는 supervisor 패턴](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/15_supervisor_pattern.svg)

### Version A — `create_supervisor()`

`langgraph-supervisor` 라이브러리의 `create_supervisor()` 한 줄이면 끝난다. 에이전트 셋을 만들고, supervisor 프롬프트를 적고, 컴파일.

```python
supervisor = create_supervisor(
    agents=[researcher, analyst, writer],
    model=model,
    prompt="You are a supervisor managing three specialists: ...",
).compile()
```

흐름이 깔끔하게 찍힌다.

```
supervisor → researcher → supervisor → analyst →
supervisor → writer → supervisor → FINISH
```

매 sub-agent가 작업을 끝낼 때마다 supervisor에게 돌아오고, supervisor가 다음 누구를 부를지 결정한다. 라이브러리 내부의 라우팅 메커니즘은 의외로 단순하다 — supervisor에게 `transfer_to_researcher`, `transfer_to_analyst` 같은 **도구**가 자동으로 붙고, 다음 에이전트를 정하는 건 그 도구를 호출하는 행위로 표현된다. 평소 도구 호출 패턴이 라우팅 모자를 쓰고 등장한 셈이다.

편하긴 한데 몇 가지가 가려진다. sub-agent 안에서 어떤 도구가 어떤 인자로 호출됐는지가 stream에 안 잡힌다. 흐름에 끼어들어 커스텀 로직을 넣을 자리도 없다. 라이브러리의 "다 알아서 해줄게"는 동시에 — "들여다볼 수 없게 해줄게"이기도 하다.

### Version B — `StateGraph`로 처음부터 만들기

같은 동작을 `langgraph-supervisor` 없이 짠다. 코드는 약 1.5배 길어지지만 모든 부분이 보인다.

핵심은 네 가지.

**State**는 모든 노드가 공유하는 화이트보드다. 메시지 누적은 LangGraph의 `add_messages` reducer가 "새 메시지를 반환한다"를 "리스트에 append한다"로 바꿔주기 때문에 동작한다.

```python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next: str  # the supervisor's decision: which node next
```

**Supervisor 노드**는 도구 호출이 아니라 **텍스트 분류**로 결정한다. 시스템 프롬프트로 한 단어만 받아내라고 시키고 — `researcher` / `analyst` / `writer` / `FINISH` — 응답을 파싱해 `state["next"]`에 적는다.

```python
def supervisor_node(state: AgentState) -> dict:
    response = model.invoke(
        [{"role": "system", "content": SUPERVISOR_PROMPT}] + state["messages"]
    )
    decision = response.content.strip().lower()
    if "finish" in decision:        next_node = "FINISH"
    elif "researcher" in decision:  next_node = "researcher"
    elif "analyst" in decision:     next_node = "analyst"
    elif "writer" in decision:      next_node = "writer"
    else:                           next_node = "FINISH"
    return {"messages": [...], "next": next_node}
```

**라우팅 함수**는 `state["next"]`를 읽어 LangGraph에게 다음 노드를 알려준다.

```python
def route_after_supervisor(state):
    return END if state["next"] == "FINISH" else state["next"]
```

**그래프 조립**에서 `add_conditional_edges`가 모든 걸 엮는다. 모든 sub-agent는 끝나면 무조건 supervisor로 돌아온다.

```python
graph_builder.add_conditional_edges(
    "supervisor", route_after_supervisor,
    {"researcher": "researcher", "analyst": "analyst",
     "writer": "writer", END: END},
)
graph_builder.add_edge("researcher", "supervisor")
graph_builder.add_edge("analyst", "supervisor")
graph_builder.add_edge("writer", "supervisor")
```

이게 전부다. 라이브러리가 가려놨던 게 표면으로 올라왔다.

## 도구 호출 vs 텍스트 분류

두 버전의 진짜 차이는 라우팅 메커니즘이다 — 같은 결정 ("다음은 누가?") 을 두 가지 다른 출력 형식으로 표현하는 차이.

| | Version A | Version B |
|---|---|---|
| 입력 (지시) | 자연어 프롬프트 | 자연어 프롬프트 |
| 출력 형식 | 도구 호출 (JSON) | 일반 텍스트 (`"researcher"`) |
| 라우팅 처리 주체 | LangGraph 내부 | 우리 함수가 파싱 |
| 인자 전달 | 쉬움 | 어색 |
| 커스텀 끼어들기 | 어려움 | 쉬움 |

도구 호출은 선택지가 많거나 호출에 구조화된 인자가 필요할 때 깔끔하다. 텍스트 분류는 선택지가 적고 결정이 빨라야 할 때 더 잘 맞는다 — 도구 정의 토큰이 빠지니까 약간 더 싸기도 하다. 우리 supervisor는 네 라벨 중 하나를 고르는 일이라 후자가 자연스럽다.

## 실제 쿼리에서 무슨 일이 일어났나

같은 질문 — *"What is LangGraph in one paragraph?"* — 을 두 버전에 던져봤다. 흥미로운 건 Version B에서 supervisor가 `researcher`를 한 번만 부르고 곧장 FINISH로 갔다는 점이다. 검색 결과가 이미 한 문단짜리 답으로 충분했고, supervisor가 그걸 알아본 거다. `analyst`와 `writer`는 건너뛰었다.

이게 좋은가 나쁜가는 상황에 따라 다르다. 가벼운 질문엔 효율적이지만 — *"모든 보고서는 분석과 글쓰기를 거친다"* 같은 제품 요구가 있다면 supervisor의 자율성이 거꾸로 문제다. Version B에선 라우팅 함수 안에 "어떤 에이전트들이 이미 일했는지"를 추적해 강제 순서를 넣을 수 있다. Version A에선 거의 불가능하다. **이게 직접 짠 그래프의 진짜 가치다.**

## 가져갈 것

다음 단계로 가기 전에 세 가지를 적어둔다.

**멀티에이전트는 무료가 아니다.** LLM 호출 횟수가 늘고(이 질문에 7번), 비용이 두세 배 뛰고, 응답이 느려진다. 단일 에이전트로 충분한지 먼저 묻고, 안 될 때만 쪼개는 게 맞다. Anthropic 자신의 가이드도 멀티에이전트를 마지막 수단으로 다룬다 — 직접 만들어본 뒤로는, 그게 회사 입장 표명이 아니라 설계 규칙이라는 게 보인다.

**라이브러리는 학습을 가린다.** Version A에서 멈췄다면 supervisor 패턴을 "썼다"고는 할 수 있어도 "안다"고는 할 수 없다. Version B로 다시 짓고서야 state, edge, routing이 머리에 박혔다. 채용 시장이 "프레임워크 없이 같은 걸 만들 수 있는가"를 묻는 게 — 이쪽 작업을 해본 뒤로 더 자연스럽게 이해된다.

**Supervisor의 결정은 출력 형식의 문제로 귀결된다.** 도구 호출이든 텍스트 라벨이든 본질은 *"LLM에게 어떻게 답하라고 할 건가"*다. 이 한 가지가 라우팅 메커니즘의 거의 전부였다.

## 다음

Part 5에서는 이 위에 **품질 루프**를 얹는다. reviewer가 writer의 결과를 검토하고, 부족하면 researcher로 다시 돌려보내는 구조. 그 결정을 supervisor의 자율 판단에 맡길지, 라우팅 함수에서 강제할지 — 오늘 봤던 트레이드오프가 한 단계 더 깊은 형태로 다시 등장한다.

직접 짠 그래프가 진짜로 빛나기 시작하는 지점일 것이다.

*To be continued.*
$ko$
WHERE slug = 'agentic-engineering-with-orchestration-part-4';

-- Verification: warn if not every post got a Korean title.
DO $$
DECLARE
    expected INTEGER := (SELECT COUNT(*) FROM posts);
    actual   INTEGER := (SELECT COUNT(*) FROM posts WHERE title_ko IS NOT NULL);
BEGIN
    IF actual <> expected THEN
        RAISE WARNING 'V6: % of % posts have title_ko after migration', actual, expected;
    END IF;
END$$;
