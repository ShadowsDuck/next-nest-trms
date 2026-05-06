---
name: do
description: The "Execute" phase. Implement a specific task from a spec file — surgical changes only. Use this skill when a user says "do T1", "implement task 2", "let's build this", "execute the spec", or when they reference a specific task number from a spec. Always reads the spec first, checks the branch, and reports with the Operational Handoff format. Never expands scope without explicit user confirmation.
---

# Do

Execution without planning creates drift. This skill assumes `brief` has already produced a spec — read it carefully before touching any code.

## Process

1. **Context** — Read `docs/specs/<feature>.md`. Identify the target task (e.g., T1). If the user didn't specify which task, ask. Ambiguity here causes wasted work.

2. **Branch Check** — Confirm the current branch matches `codex/<feature-slug>` from the spec. If it doesn't, stop and confirm before writing anything. Writing on the wrong branch is hard to untangle later.

3. **Pre-flight** — Read the target files before writing code. The spec describes intent; the codebase describes reality. Gaps between them need to be resolved before you start, not halfway through. Stop and ask if:
   - A dependency is missing from the codebase.
   - The spec conflicts with current code state.
   - The task instruction is ambiguous.
   - Classify each required action as `Agent-doable now` or `User-required manual`.

4. **Implement** — Touch only the files listed in the task. Follow Thai comment rules (every new function gets a Thai comment stating what it's responsible for). No unrelated refactors, no opportunistic cleanup.

5. **Verify** — Run the task's verification step. If the verify instruction is vague, define the smallest concrete check that proves completion _before_ writing any code — not after. This prevents shipping broken work.

6. **Commit Message Draft** — If verify passes:
   - Do not stage or commit.
   - Propose one short conventional commit message scoped to this task only (e.g., `feat(auth): secure tags and org-units controllers`).
   - If verify fails, report the failure and stop. Do not propose a success commit message.

7. **Report** — Use the Operational Handoff format below.

## Spec Mutability

The spec is a living document, but changing it has real consequences — downstream tasks, the user's mental model, and commit history all depend on it staying stable. Apply this test:

**Does this change affect what the user signed off on?**

- ✅ **Implementation detail** — File path adjusted to match reality, function signature changed, library API differs. Decide freely.
  - Update `spec.md` _only if_ leaving it unchanged would cause a subsequent task to misread it and do the wrong thing. Otherwise, log in report only.
- 🛑 **Scope change** — Adding tasks (over-engineering), removing tasks (cutting scope), changing goals, violating constraints.
  - Stop immediately. Do not implement. Do not update spec. Request explicit user confirmation.

## Scope Control

If implementation reveals the task is larger than the spec describes, stop at the nearest safe checkpoint and propose a spec update. Silently expanding scope is how features quietly become unshippable.

## Operational Handoff (Required)

End every execution with this report — even for simple tasks. It's how `ship` knows what happened:

```
Done by agent:
- <what was implemented>

Not done / blocked:
- <anything left incomplete and why>

User manual actions required:
- <explicit steps the user must take — never implied>

Spec deviations:
- <implementation details that differed from spec, if spec was not updated>

Commands intentionally not run:
- <command> — <reason>

Suggested commit message: <conventional commit>
```
