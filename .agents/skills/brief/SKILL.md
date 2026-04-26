---
name: brief
description: The "Think & Draft" phase. Interview the user, refine the plan, find edge cases, then generate a Spec in docs/specs/ and update the dashboard.
---

# Brief

## Mode Selection (Decide First)

| Signal                                                                                              | Mode            |
| --------------------------------------------------------------------------------------------------- | --------------- |
| Small, localized change with obvious expected behavior — no ambiguity about what "done" looks like  | **Lightweight** |
| New feature, unclear requirements, UX flow, or any change that requires thinking through edge cases | **Full**        |

### Lightweight Mode

1. Ask clarifying questions in a **grill-me style** (one question at a time, include a recommended answer, and push on edge cases).
2. Confirm objective + constraints in one message.
3. State assumptions explicitly.
4. Write execution plan inline in chat — **no Spec file** in this mode.
5. **Hard Gate**: Do not implement until the user explicitly sends **✅ แผนโอเคแล้ว**.
6. **If ambiguity appears at any point, continue grilling; switch to Full mode when scope or dependencies grow beyond a lightweight change.**
7. Proceed to `do` only after the gate is satisfied.

### Full Mode — Workflow

1. **Understand** — Explore the codebase before asking anything.
2. **Grill** — Use grill-me behavior strictly: one question at a time, recommended answer, and relentless edge-case probing.
3. **Synthesize** — Summarize Why / What / Constraints when plan is solid.
4. **Spec** — Create `docs/specs/<slug>.md` (English only) only after **✅ แผนโอเคแล้ว**.
5. **Dashboard** — Add a `Draft` entry to `docs/README.md`.
   - Format: `[Feature Name]` (`Status`) — [View Spec](./specs/<slug>.md) — `[Date]`

## Rules

- **Hard Gate**: No Spec until user sends **✅ แผนโอเคแล้ว**.
- **Hard Gate**: No implementation in **any mode** until user sends **✅ แผนโอเคแล้ว**.
- **Hard Gate**: Ask clarifying questions and receive user input before starting implementation.
- **Grill Quality Bar (Lightweight + Full)**:
  - Ask one question at a time.
  - Provide a recommended answer with each question.
  - Probe edge cases and ambiguous terms until decisions are concrete.
  - If a question can be answered from the codebase, do that first instead of asking.
- **Context First**: Find answers in the codebase before asking the user.
- **No Placeholders**: No "TBD", "TODO", or vague logic — use explicit file paths and behavior descriptions.
- **Decompose**: Target 5 tasks per Spec. If larger, split into separate Spec files.
- **Self-Review**: Silently check for contradictions, missing paths, or ambiguous logic before finalizing.
- **Targeted Refactor Only**: If affected code is tangled, add a dedicated refactor task before the feature task. No unrelated changes.

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

## Tasks

- [ ] T1 — <action> · File: `<path>` · Verify: <command or check>
- [ ] T2 …
```
