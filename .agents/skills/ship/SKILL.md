---
name: ship
description: The "Review & Commit" phase. Verify quality, check Thai comments, and commit with a structured message.
---

# Ship

## Process

### 1. Verify (Iron Law — No Evidence = No Completion)

- Identify the full change scope (e.g., `web`, `api`, shared packages).
- Run the **smallest verification set** that covers all changed targets:
  1. Task-specific or file-specific tests (preferred).
  2. Typecheck for each affected target.
  3. Lint for each affected target.
- If a bug fix lacks test coverage and the surrounding code already has tests, add a focused test first.
- **If any check fails, STOP. Report the error. Do not draft a commit.**

### 2. Code Review

- Surgical changes only — no scope creep.
- Every new function has a Thai comment.
- Implementation matches Spec constraints.

### 3. Draft Commit

Analyze `git diff --staged` (or `git diff`) and write:

```
<type>(<scope>): <description under 72 chars, present tense, imperative>

- <why / what bullet 1>
- <why / what bullet 2>
```

### 4. Present & Execute

Report:

- ✅ / ❌ What was verified and what was not.
- Readiness level — pick exactly one:
  - `Review-ready` — all runnable checks in scope passed; no known gaps.
  - `Commit-ready` — required local checks passed; non-local checks remain and must be listed.
  - `Needs-fix` — failed check or unacceptable gap remains.
- The drafted commit message.

Then ask the user to choose **one**:

1. Run the commit for me.
2. I will copy the message and commit myself.
3. Discard / Hold off.

After a successful commit, update `docs/README.md` status to `Completed` if all spec tasks are done.
