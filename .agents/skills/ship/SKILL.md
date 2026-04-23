---
name: ship
description: The "Review & Commit" phase. Verify code quality, check for Thai comments, and commit the changes with a high-quality message.
---

# Ship

This skill is the final gatekeeper before code is merged/committed.

## Process

1.  **Review**:
    - Check for simplicity and surgical changes.
    - **Verify Thai Comments**: Every new function must have one.
    - Check against Spec constraints.
2.  **Draft Commit**:
    - Use `git diff --staged` or `git diff` to analyze changes.
    - Format: `<type>(<scope>): <description>` (description must be <72 chars, present tense, imperative mood).
    - Body: Explain WHAT and WHY using a **concise** bulleted list (`-`). Keep it short.
      ```text
      feat(ui): add row actions to data tables
      - Add DataTableRowActions with DropdownMenu to unify table actions
      - Replace placeholder icons in Course and Employee tables
      ```
3.  **Execute**:
    - Present the review and commit message to the user.
    - If approved, perform the commit.
    - Update `docs/README.md` if the entire feature is `Completed`.
