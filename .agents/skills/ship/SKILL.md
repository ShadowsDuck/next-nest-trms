---
name: ship
description: The "Final Integration" phase. Verify branch readiness, review task commits, and prepare merge.
---

# Ship

## Process

### 1. Verify

- Identify the full change scope (e.g., `web`, `api`, shared packages).
- Run the smallest verification set that covers all changed targets:
  1. Task-specific or file-specific tests (preferred).
  2. Typecheck for each affected target.
  3. Lint for each affected target.
- **If any check fails, stop. Report the error. Mark as `Needs-fix`.**

### 2. Commit Sequence Review

- Confirm work happened on the correct feature branch for this spec.
- Confirm each task has its own commit (`1 task = 1 commit`).
- Confirm no unrelated files are mixed into task commits.
- If uncommitted required changes exist, list them and stop before declaring merge readiness.

### 3. Finalize Status

Report exactly one readiness level:

- `Pass` — all runnable checks passed; no known gaps.
- `Needs-fix` — a check failed or an unacceptable gap remains.

Include:

- Branch name and task-to-commit mapping.
- Any remaining non-local checks or uncommitted changes.
- Merge recommendation: ready to merge / ready for PR review only / not ready.

### 4. Operational Handoff (Required)

Provide the standard Operational Handoff report (Done, Not done, User actions, Commands not run).

### 5. Dashboard Finalization

Update `docs/README.md` status to `Completed` only when all spec tasks are done and committed.

### 6. PR Description

Generate a ready-to-paste PR description inside a markdown code block (for easy copy-pasting):

```markdown
## What

<one-line summary of the feature>

## Changes

<bullet list derived from task commits>

## Manual steps required

<from User manual actions — omit section if none>
```
