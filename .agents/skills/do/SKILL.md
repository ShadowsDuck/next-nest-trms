---
name: do
description: The "Execute" phase. Implement a specific task (e.g., T1) from a spec file. Surgical changes only.
---

# Do

## Process

1. **Context** — Read `docs/specs/<feature>.md` and identify the target task.
2. **Branch Check** — Confirm work is on the correct feature branch (`codex/<feature-slug>`).
   - If not on the expected branch, stop and confirm before continuing.
3. **Pre-flight** — Review target files before writing any code. Stop and ask if:
   - A dependency is missing.
   - The spec conflicts with the current state of the codebase.
   - The task instruction is ambiguous.
   - List required prerequisites as `Agent-doable now` or `User-required manual`.
4. **Implement** — Touch only files listed in the task. Follow Thai Comment rules. No unrelated refactors.
5. **Verify** — Run the task's verification step. If the verify instruction is vague, define the smallest concrete check that proves completion before writing code.
6. **Commit** — If verify passes:
   - Stage only files that belong to this task.
   - One commit per task. Do not bundle future task files.
   - If verify fails, do not commit.
7. **Report** — Use the Operational Handoff format below.

## Spec Mutability

The spec is a living document, but changes must follow this rule:

**The only question that matters: does this change affect what the user signed off on?**

What the user signed off on includes everything in the spec: tasks, goals, constraints, and deliverables.

- ✅ **Implementation detail** — How the work is done (file path adjusted to match reality, function signature changed, library API differs from assumption). Agent decides freely.
  - Update `spec.md` **only if** leaving it as-is will cause a subsequent task to misread the spec and work incorrectly. Otherwise, log in report only — do not touch `spec.md`.
- 🛑 **Scope change** — Anything that affects what the user signed off on, in either direction:
  - Adding tasks (Anxious AI: over-engineering, unsolicited edge case handling)
  - Removing tasks (Lazy AI: cutting scope, merging work)
  - Changing goals or violating Constraints
  - **Stop immediately. Do not implement. Do not update spec. Request explicit user confirmation.**

## Scope Control

If implementation reveals the task is larger than described, stop at the nearest safe checkpoint and propose a spec update. Do not silently expand scope.

## Operational Handoff (Required)

Format your final report using these sections:
- `Done by agent`
- `Not done / blocked`
- `User manual actions required`
- `Spec deviations` (implementation details that differed from spec — only if spec was not updated)
- `Commands intentionally not run` (with reason)

Never omit a required manual action. If any command was not run, state it explicitly and explain why.
