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
- **English Only Specs**: The `spec.md` file MUST be written in English entirely.
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

## Non-Negotiable Enforcement (Hard Fail)

If any item below is violated, the agent must treat it as a process failure and stop:

1. The agent starts writing code before the `brief` phase is completed.
2. The agent creates/edits spec files before user sends `✅ แผนโอเคแล้ว`.
3. The agent skips user interview questions and silently assumes requirements.
4. The agent writes any file (spec, dashboard, code) before switching to `codex/<feature-slug>`.
5. The agent continues to implementation after the first docs commit in `brief`.

Required behavior on failure:

- Explicitly state: `Process violation in brief: <what was violated>`
- Stop execution immediately.
- Ask user whether to restart `brief` from Step 1.

## Mandatory Interaction Protocol

The agent MUST follow this exact interaction order:

1. Read relevant codebase context.
2. Ask one question only (with recommended answer).
3. Wait for user response.
4. Repeat step 2-3 until scope is concrete.
5. Summarize Why / What / Constraints.
6. Ask for explicit confirmation: `ตอบกลับด้วย ✅ แผนโอเคแล้ว`.
7. Wait for that exact confirmation text.
8. Create/switch branch.
9. Write spec + dashboard draft.
10. Commit docs only.
11. Stop and hand off to `do`.

The agent is NOT allowed to:

- Jump from question phase to implementation.
- Combine `brief` and `do` in one execution.
- Proceed when confirmation is missing or ambiguous.

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
