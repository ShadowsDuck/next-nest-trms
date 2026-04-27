---
name: brief
description: The "Think & Draft" phase. Interview the user, refine the plan, find edge cases, then generate a Spec in docs/specs/ and update the dashboard.
---

# Brief

## Workflow

1. **Understand** — Explore the codebase before asking anything.
2. **Grill** — Use grill-me behavior strictly: one question at a time, recommended answer, and relentless edge-case probing.
3. **Synthesize** — Summarize Why / What / Constraints when plan is solid.
4. **Branch Setup** — Create and switch to the feature branch before writing spec files.
   - Branch format: `codex/<feature-slug>`.
   - If branch creation/switch fails, stop and report the blocker.
5. **Execution Strategy** — Define branch and commit policy in the spec before handoff.
   - Recommend one feature branch: `codex/<feature-slug>`.
   - Require commit granularity: `1 task = 1 commit` after task verification passes.
   - Ensure every task has a concrete verify command/check.
   - Add explicit prerequisites per task (env vars, credentials, external resources).
   - Mark each prerequisite as either `Agent-doable` or `User-required`.
6. **Spec** — Create `docs/specs/<slug>.md` (English only) only after **✅ แผนโอเคแล้ว**.
7. **Dashboard** — Add a `Draft` entry to `docs/README.md`.
   - Format: `[Feature Name]` (`Status`) — [View Spec](./specs/<slug>.md) — `[Date]`
8. **Commit Brief Output** — Commit spec + dashboard as the first feature-branch commit before handoff.
   - Stage only brief artifacts (`docs/specs/<slug>.md`, `docs/README.md`).
   - Commit message should clearly mark spec draft creation.
9. **Stop** — Do not implement code. Hand off to `do` after the spec and dashboard commit is complete.

## Rules

- **Hard Gate**: No Spec until user sends **✅ แผนโอเคแล้ว**.
- **Branch First**: Never write spec/dashboard on `main`; create/switch feature branch first.
- Ask questions and get user input before writing the spec.
- After **✅ แผนโอเคแล้ว**, create the spec and update the dashboard only.
- No code implementation in this skill.
- Grill rules:
  - One question at a time.
  - Include a recommended answer.
  - Probe edge cases until decisions are concrete.
  - Check the codebase first when possible.
- **Context First**: Find answers in the codebase before asking the user.
- **No Placeholders**: No "TBD", "TODO", or vague logic — use explicit file paths and behavior descriptions.
- **Decompose**: Target 5 tasks per Spec. If larger, split into separate Spec files.
- **Execution-Ready Tasks**: Each task must include a verification step concrete enough to gate a task-level commit.
- **No Silent Assumptions**: Spec must explicitly list external dependencies (DB state, cloud credentials, API keys, folders/buckets, etc.).
- **Manual Step Clarity**: Any step requiring user action must be written as a concrete checklist item, never implied.
- **Brief Commit Required**: Do not hand off to `do` until brief outputs are committed on the feature branch.
- **Self-Review**: Silently check for contradictions, missing paths, or ambiguous logic before finalizing.
- **Targeted Refactor Only**: Add a refactor task only if needed. No unrelated changes.
- Next step after `brief` is `do` using the generated spec.

## Spec Template

```md
## Why

<problem / motivation>

## What

<concrete deliverable>

## Constraints

- Must: Thai comments, surgical edits only
- Must Not: <list>
- Out of Scope: <list>

## Execution Strategy

- Branch: `codex/<feature-slug>`
- Commit Policy: `1 task = 1 commit` after verify passes
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: <list>
- User-required: <list>

## Tasks

T1 — <action> · File: `<path>` · Verify: <command or check>
T2 — …
```
