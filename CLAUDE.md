# CLAUDE - Project Agent Operating Rules

---

## Project Start Trigger

When the user says **"Let's start the project"**,
Claude asks the questions below **one by one in order**.
After receiving all answers, automatically generate the `PROJECT_BRIEF.md` file.

---

### Questions to Collect at Project Start

```
[Q1] What is the project name?

[Q2] Describe the final goal of this project in one sentence.
     (e.g., "A firmware that reads sensor data and transmits it via UART")

[Q3] What language and environment will be used?
     (e.g., C, STM32, GCC, Makefile, etc.)

[Q4] List the main features of the project.
     (e.g., 1. UART receive  2. Data parsing  3. LED control)

[Q5] Are there any directory structure or file organization requirements?
     Answer "none" if not applicable.

[Q6] What are the completion criteria?
     Beyond build success, you must include expected output values or verification methods.
     Without expected values, logical verification is impossible and completion cannot be declared.
     (e.g., build success + verify "input 10 -> output 20" + specific test passing)

[Q7] Any additional reference information to share?
     (e.g., existing code style, reference documents, notes, etc.)
     Answer "none" if not applicable.
```

> After collecting all answers, generate `PROJECT_BRIEF.md` and
> confirm with: "Project brief has been created. Shall we begin?"

---

## Auto-Generated PROJECT_BRIEF.md Format

```markdown
# Project Brief

## Project Name
{answer}

## Final Goal
{answer}

## Tech Stack & Environment
{answer}

## Main Features
{answer}

## Directory Structure
{answer}

## Completion Criteria
{answer}

## Notes
{answer}

## Task Progress
- [ ] Step 1:
- [ ] Step 2:
- [ ] Step 3:
```

---

## Mandatory Pre-Task Steps

Before writing or modifying any code, the following 3 steps must be completed.
Skipping these steps and jumping directly into coding is prohibited.

```
STEP 1. Summarize the current task goal in one line
        -> Format: "[Task Goal]: {goal description}"

STEP 2. Clearly define the target and scope of modification or implementation
        -> Identify which files, functions, and scope are involved

STEP 3. Define expected inputs, outputs, and failure cases
        -> Write down what the expected output should be for normal operation
        -> List possible failure cases in advance
```

---

## Task Execution Rules

### Basic Principles
- Always read `PROJECT_BRIEF.md` and confirm the goal before starting any task
- Perform only one step at a time
- Update the progress status in `PROJECT_BRIEF.md` upon completing each step

### Definition of Approval

Throughout this document, "proceed after user approval" is only valid when the following conditions are met.

```
Responses that count as approval:
   - Explicit agreement such as "go ahead", "OK", "you can", "yes", "do it"

Responses that do NOT count as approval:
   - No response
   - Ambiguous responses such as "probably fine"
   - Claude self-judging that "it seems approved"
```

Proceeding without confirmed approval is prohibited.

### Command Execution Permission Scope

Commands and file operations are divided into two permission tiers:

```
Auto-approved (no confirmation required):
   - Any command or file operation that operates exclusively within the project
     directory defined in PROJECT_BRIEF.md
   - Examples: creating/editing/deleting project files, running build commands,
     executing test scripts, installing dependencies listed in the project spec

Requires explicit user approval:
   - Any command that affects files or systems OUTSIDE the project directory
   - Examples: modifying system config, installing global packages,
     accessing paths outside the project root, network operations to external
     services not specified in PROJECT_BRIEF.md
```

> The user granting project access at the start of a session counts as blanket
> approval for all in-project operations. Claude does not pause to ask
> "shall I run this?" for routine in-project commands.

### Goal Change Procedure

If the user requests a goal change during the project, the following order must be followed.

```
1. Update the goal in PROJECT_BRIEF.md BEFORE modifying any code
2. Show the changes to the user and get approval
3. Proceed with code modification after approval
```

Modifying code before updating the brief creates a mismatch between the brief and code,
causing all future judgments to break down. Never change this order.

If the user demands code modification while skipping the brief update,
explicitly state the risk of inconsistency and delegate the decision to the user.

### Step Completion Criteria
- Code must build successfully
- Must actually run and verify the result
- "I think it will work" is not completion. Prove it with actual execution results.

---

## Failure Handling Rules (Must read this section on every failure)

### When a failure occurs, follow the steps below in order

```
STEP 1. Re-read PROJECT_BRIEF.md
        -> Confirm that the current task aligns with the final goal

STEP 2. Classify the failure cause
        -> If the following external signals are observed, temporarily classify as [External Candidate]
           - Network: connection refused, timeout, DNS failure
           - Server response: HTTP 5xx, API rate limit
           - Environment: compiler/tool version mismatch message
           - File system: permission error on files Claude did NOT modify
           - Dependency: error from libraries Claude did NOT modify
           - Model limits: context limit, token limit exceeded
           - Tool/Infrastructure: tool execution failure, sandbox timeout, execution environment unresponsive
        -> If classified as [External Candidate], retry ONCE without modifying code
           - If error disappears after retry -> Confirm as transient external factor, classify as [External]
           - If error reoccurs after retry -> Proceed to next step
        -> However, even if an external signal is observed, if Claude's modified code
          is in the error's occurrence path AND the error reoccurs, classify as [Internal]
        -> If none of the above signals are observed, unconditionally classify as [Internal]
        -> If [External - Model Limits]: propose context cleanup (summarize and compress)
          and proceed after user approval
        -> If [External - Other]: immediately report to user with current completed steps status
          and wait for instructions
        -> If [Internal]: proceed to STEP 3

STEP 3. State the failure cause in one line
        -> Format: "[Failure Cause]: {cause description}"

STEP 4. Decide on a fix method that addresses the cause
        -> Do not repeat the same method

STEP 5. Retry after applying the fix

STEP 6. After 3 consecutive failures on the same issue
        -> If the cause cannot be found in the current step's code,
          inspect files, data, and environment state generated in previous steps
        -> If a previous step's artifact is the cause, report to user and wait for instructions
        -> If unrelated to previous step artifacts, switch to a different approach
        -> State the reason for changing the approach

STEP 7. If all 3 approaches fail
        -> Stop the task
        -> Summarize the failures and all attempted methods and report to user
        -> Do not continue arbitrarily
```

---

## Rule Violation Handling

If any of the prohibited items below are violated, the task is **considered a failure.**

- Even if the result appears correct, violating a rule means failure
- Must return to the step where the violation occurred, fix it, and redo from that step
- This is NOT a full project restart -- only redo from the violation point onward
- The judgment "the result is correct so it's fine" is not permitted

---

## Prohibited Actions (Never violate)

> These rules apply **at all times** regardless of the project.
> The moment any action below is about to be taken during work, stop immediately and reconsider.

---

### Repetition & Retry (4)

**#01. No retrying without reading the error message**
**#02. No re-running the same code without any changes**
**#03. No assuming "it will work this time" after partial fixes without evidence**
**#04. No repeating the same approach after 3+ consecutive failures**

### Scope Violation (7)

**#05. No adding features that were not requested**
**#06. No unrequested refactoring**
**#07. No unrequested optimization**
**#08. No modifying files unrelated to the current step**
**#09. No adding new external libraries or dependencies without permission**
**#10. No changing function signatures of functions already in use without permission**
**#11. No modifying the build system (Makefile, etc.) without permission**

### Judgment & Assumption (5)

**#12. No arbitrarily interpreting ambiguous requirements**
**#13. No hiding failures and working around them**
**#14. No reporting partial success as full success**
**#15. No ignoring compiler warnings**
**#16. No omitting error handling**

### Analysis & Design (4)

**#17. No modifying code after seeing only part of it / No modifying without analyzing the impact scope**
**#18. No implementing a function without defining its I/O**
**#19. No modifying code without a plan**
**#20. No ignoring execution environment differences**

### Code Writing (5)

**#21. No proceeding to the next step with a failing build**
**#22. No declaring completion without running the code**
**#23. No inserting magic numbers without explanation**
**#24. No inserting temporary code (hardcoding) without comments**
**#25. No unauthorized modification of existing working code**

### Files & Structure (4)

**#26. No arbitrary modification of CLAUDE.md / PROJECT_BRIEF.md**
**#27. No unauthorized changes to directory structure**
**#28. No leaving temporary files behind**
**#29. No large-scale modification of original files without backup**

### Reporting (3)

**#30. No reporting retry attempts without stating the cause**
**#31. No unclear success reports**
**#32. No batch reporting after fixing multiple issues simultaneously**

### Code Quality (3)

**#33. No judging success based on a single test case**
**#34. No writing code whose behavior cannot be explained**
**#35. No copy-pasting external code without verifying its source**

---

## Rule Conflict Priority

When two rules conflict, follow the priority below.

```
Priority 1. Project goal (final goal stated in PROJECT_BRIEF.md)
Priority 2. Resolving the failure cause (solving the current blocker)
Priority 3. Scope restriction rules (no file modification, no structure change, etc.)
Priority 4. Code quality rules (magic numbers, temporary code, etc.)
```

**When a conflict occurs, always report the situation to the user and proceed after approval.**

---

## When Assumption is Unavoidable

When something not in the spec must be assumed, always note it in a comment.

```
// [ASSUMPTION] description of assumption
```

And inform the user of the assumption made.

---

## Task Log Rules

Report in the following format at the start and completion of each step.

```
[START] Step N: {task description}
[DONE]  Step N: {result summary}
[FAIL]  Step N: {failure cause} -> {next attempt method}
```

---

## Final Completion Declaration Conditions

All items below must be satisfied before declaring completion.

- [ ] All completion criteria in PROJECT_BRIEF.md have been achieved
- [ ] Build was successful
- [ ] Actual execution result has been verified
- [ ] Execution result logically matches the goal and expected output in PROJECT_BRIEF.md
- [ ] All [ASSUMPTION] items have been communicated to the user
- [ ] All progress checkboxes in PROJECT_BRIEF.md are checked
- [ ] Self-verification report has been written and shown to the user

### Mandatory Self-Verification Report

Before declaring completion, Claude must output the following report.

```
[SELF-VERIFICATION REPORT]

1. How was testing conducted?
2. What inputs were tested and what outputs were verified?
3. What failure cases or edge cases were validated?
4. What areas may be insufficiently tested?
```

---

*This file is the standard for all work. Re-read this file whenever in doubt.*
