---
name: brief
description: The "Think & Draft" phase. Interview the user, refine the plan, find edge cases, then generate a Spec in docs/specs/ and update the dashboard.
---

# Brief

## Workflow

1. **Understand** — Explore the codebase before asking anything.
2. **Grill** — One question at a time, recommended answer, relentless edge-case probing.
3. **Synthesize** — Summarize Why / What / Constraints when plan is solid.
4. **Branch Setup** — Create and switch to the feature branch before writing any files.
   - Branch format: `codex/<feature-slug>`.
   - If branch creation or switch fails, stop and report the blocker.
5. **Execution Strategy** — Define in spec before handoff.
6. **Spec** — Create `docs/specs/<slug>.md` only after **✅ แผนโอเคแล้ว**.
7. **Dashboard** — Add a `Draft` entry to `docs/README.md`.
   - Format: `[Feature Name]` (`Draft`) — [View Spec](./specs/<slug>.md) — `[Date]`
8. **Commit** — Commit spec + dashboard as the first feature-branch commit.
   - Stage only `docs/specs/<slug>.md` and `docs/README.md`.
   - Commit message: `docs: draft spec for <feature-slug>`
9. **Stop** — No code implementation. Hand off to `do`.

## Rules

- **Hard Gate**: No Spec until user sends **✅ แผนโอเคแล้ว**.
- **Branch First**: Never write spec or dashboard on `main`.
- **No Placeholders**: No "TBD", "TODO", or vague logic — explicit file paths and behavior only.
- **Decompose**: Use 7 tasks as a soft upper bound. If >7 tasks, split into separate Spec files.
- **Execution-Ready Tasks**: Each task must have a verify step concrete enough to gate a commit.
- **Manual Step Clarity**: Any step requiring user action must be a concrete checklist item, never implied.
- **No Silent Assumptions**: List all external dependencies explicitly (DB state, credentials, API keys, buckets).
- **Targeted Refactor Only**: Add a refactor task only if needed. No unrelated changes.
- Grill rules:
  - One question at a time.
  - Include a recommended answer.
  - Probe edge cases until decisions are concrete.

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
