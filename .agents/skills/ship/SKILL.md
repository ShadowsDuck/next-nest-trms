---
name: ship
description: The "Final Integration" phase. Verify branch readiness, review task commits, and prepare merge.
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
- **If any check fails, STOP. Report the error. Mark as `Needs-fix`.**

### 2. Commit Sequence Review

- Confirm work happened on one feature branch for this spec.
- Confirm tasks are committed as logical units (`1 task = 1 commit` unless explicitly grouped by user request).
- Confirm no unrelated files are mixed into task commits.
- If there are uncommitted required changes, list them and stop before merge readiness.

### 3. Code Review

- Surgical changes only — no scope creep.
- Every new function has a Thai comment.
- Implementation matches Spec constraints.

### 4. Finalize Status

Report:

- ✅ / ❌ What was verified and what was not.
- Readiness level — pick exactly one:
  - `Review-ready` — all runnable checks in scope passed; no known gaps.
  - `Commit-ready` — required local checks passed; non-local checks remain and must be listed.
  - `Needs-fix` — failed check or unacceptable gap remains.
- Branch summary:
  - Feature branch name
  - Task-to-commit mapping
  - Any remaining uncommitted changes
- Merge recommendation:
  - Ready to merge
  - Ready for PR review only
  - Not ready

### 5. Dashboard Finalization

- Update `docs/README.md` status to `Completed` only when all spec tasks are done and committed.
