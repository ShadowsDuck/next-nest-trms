---
name: do
description: The "Execute" phase. Implement a specific task (e.g., T1) from a spec file. Surgical changes only.
---

# Do

## Process

1. **Context** — Read `docs/specs/<feature>.md` and identify the target task.
   - Treat the spec as read-only. Do not edit or update `spec.md`.
2. **Pre-flight** — Review target files before writing any code. Stop and ask if:
   - A dependency is missing or the instruction is unclear.
   - The spec is stale (file paths no longer match reality).
   - The task conflicts with existing code.
   - Do not guess. Do not proceed with a stale spec without confirming.
3. **Implement**:
   - Touch only files listed in the task.
   - If the worktree has unrelated user changes, work around them. Stop if they cause a direct conflict.
   - Follow Thai Comment rules (one comment per new function, in Thai).
   - No unrelated refactors.
4. **Verify** — Run the task's verification step. If the verify instruction is vague, define the smallest concrete check that proves completion before writing code.
5. **Report** — State what was done and the verification result. Suggest `ship` if all tasks are complete.

## Scope Control

If implementation reveals the task is larger than described, stop at the nearest safe checkpoint and propose a spec update. Do not silently expand scope.
