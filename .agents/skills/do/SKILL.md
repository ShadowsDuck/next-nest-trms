---
name: do
description: The "Execute" phase. Implement tasks from a spec file with surgical precision. Trigger this skill whenever a user says "do T1", "implement task 3", "let's build this", "execute the spec", "do all tasks", or references any task number from a brief/spec. Reads the spec first, checks the branch, then implements and reports in Operational Handoff format. Scope never expands without explicit confirmation. Commit behavior: single task or named subset → propose message and wait; "do all tasks" → auto-commit and push after each task passes verify.
---

# Do

This skill assumes `brief` has already produced a spec in `docs/specs/<feature>.md`. Execution without that foundation creates drift — read the spec carefully before touching any code.

## Code Convention

Every new function must have a **Thai comment** stating what it is responsible for. This applies to all code written in this project, without exception.

## Process

Work through these steps in order for each task:

### 1. Context

Read `docs/specs/<feature>.md` and identify the target task. If the user didn't specify which task, ask — ambiguity at the start causes far more wasted work than a 30-second clarification.

### 2. Branch Check

Confirm the current branch matches `codex/<feature-slug>` from the spec. Writing on the wrong branch is genuinely hard to untangle — stop and confirm before writing anything if there's a mismatch.

### 3. Pre-flight

Read the target files before writing code. The spec describes intent; the codebase describes reality. Resolve gaps between them _before_ starting, not halfway through. Stop and ask the user if:

- A dependency is missing from the codebase
- The spec conflicts with the current code state
- The task instruction is ambiguous

Also classify each required action as **Agent-doable now** or **User-required manual** — this shapes the report.

### 4. Implement

Touch only the files listed in the task. No unrelated refactors, no opportunistic cleanup. If a change would improve something adjacent but wasn't asked for, note it in the report instead.

### 5. Verify

Run the task's verification step. If the verify instruction is vague, define the smallest concrete check that proves completion _before_ writing any code — not after. Shipping without a defined verification step is how broken work gets merged silently.

### 6. Commit

If verify passes:

- **Single task** (`do T1`) — Propose a commit message. Wait for user confirmation before staging or committing anything.
- **Explicit subset** (`do T1 T3`) — Propose a commit message after each task. Wait for confirmation before moving to the next.
- **All tasks** (`do all tasks`) — Auto-stage, commit, and push after each task passes verify. Move immediately to the next task. After all tasks complete, print the final summary table (see below).

If verify fails in any mode: report the failure and stop. Do not commit, do not push, do not proceed.

### 7. Report

Use the Operational Handoff format below. For a single task: report once at the end. For a subset or "do all tasks": report after each task. A failure report is the stopping point — never continue past it.

---

## Spec Mutability

The spec is a living document, but changing it ripples into downstream tasks, the user's mental model, and commit history. Before touching the spec, ask: **does this change affect what the user signed off on?**

- ✅ **Implementation detail** — file path adjusted to match reality, function signature changed, library API differs.
  - Update `spec.md` _only if_ leaving it wrong would cause a future task to misread it. Otherwise, log the deviation in the report only.
- 🛑 **Scope change** — adding tasks, removing tasks, changing goals, violating constraints, or discovering the task is significantly larger than described.
  - Stop at the nearest safe checkpoint. Do not implement. Do not update the spec. Request explicit user confirmation before proceeding.

Silently expanding scope is how features quietly become unshippable.

---

## Operational Handoff (Required)

End every task with this report — even simple ones. It's how `ship` knows what happened and what still needs human attention:

```
Done by agent:
- <what was implemented>

Not done / blocked:
- <anything left incomplete and why, or "none">

User manual actions required:
- <explicit steps the user must take — never implied, or "none">

Spec deviations:
- <implementation details that differed from spec, if spec was not updated, or "none">

Commands intentionally not run:
- <command> — <reason, or "none">

Commit: <hash> — <conventional commit message>
(write "Suggested commit: <message>" instead if waiting for user confirmation)
```

### Final Summary (do all tasks only)

```
All tasks complete.

| Task | Commit  | Message      |
|------|---------|--------------|
| T1   | abc1234 | feat(x): ... |
| T2   | def5678 | feat(y): ... |
```
