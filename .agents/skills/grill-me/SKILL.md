---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

# Grill Me

Interview the user relentlessly about every aspect of their plan or design until a shared understanding is reached. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

## Instructions

1.  **Ask one question at a time.** Do not overwhelm the user with multiple questions.
2.  **Provide a recommended answer** for each question you ask. This helps the user make decisions faster.
3.  **Explore the codebase first.** If a question can be answered by looking at the current implementation, do that instead of asking the user.
4.  **Resolve dependencies.** Ensure that decisions made in one branch don't conflict with or break decisions made in another.
5.  **Be relentless but helpful.** The goal is to find edge cases and potential failure points before implementation begins.

## When to use

- When the user says "grill me".
- When a new feature is proposed without a clear technical design.
- When a complex refactoring is planned.
- When the user wants to stress-test their ideas.
