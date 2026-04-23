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
    - Use `git diff --staged`.
    - Format: `<type>(<scope>): <subject>` + `<body>` (explaining WHY).
3.  **Execute**:
    - Present the review and commit message to the user.
    - If approved, perform the commit.
    - Update `docs/README.md` if the entire feature is `Completed`.
