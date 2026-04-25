---
name: ship
description: The "Review & Commit" phase. Verify code quality, check for Thai comments, and commit the changes with a high-quality message.
---

# Ship

This skill is the final gatekeeper before code is merged/committed.

## Process

1.  **The Iron Law of Verification**:
    - **NO COMPLETION CLAIMS WITHOUT EVIDENCE.**
    - Determine which app was modified (e.g., `web` or `api`).
    - You MUST run `pnpm --filter <app-name> typecheck` and `pnpm --filter <app-name> lint`.
    - If verification fails, STOP immediately and report the error to the user. Do not proceed to drafting a commit.
2.  **Code Review**:
    - Check for simplicity and surgical changes.
    - **Verify Thai Comments**: Every new function must have one.
    - Check against Spec constraints.
3.  **Draft Commit**:
    - Use `git diff --staged` or `git diff` to analyze changes.
    - Format: `<type>(<scope>): <description>` (description must be <72 chars, present tense, imperative mood).
    - Body: Explain WHAT and WHY using a **concise** bulleted list (`-`). Keep it short.
      ```text
      feat(ui): add row actions to data tables
      - Add DataTableRowActions with DropdownMenu to unify table actions
      - Replace placeholder icons in Course and Employee tables
      ```
4.  **Present Options (Execute)**:
    - Present the verification results, the drafted commit message, and ask the user to choose exactly one of these options:
      1. Run the commit for me (AI executes `git commit`).
      2. I will copy the message and commit it myself.
      3. Discard / Hold off (Do not commit).
    - Wait for the user's explicit choice.
    - Once successfully committed, update `docs/README.md` if the entire feature is `Completed`.
