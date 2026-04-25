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

1. Confirm objective + constraints in one message.
2. State assumptions explicitly.
3. Write execution plan inline — no Spec file.
4. **If ambiguity appears at any point, switch to Full mode immediately.**
5. Proceed to `do`.

### Full Mode — Workflow

1. **Understand** — Explore the codebase before asking anything.
2. **Grill** — One question at a time with a recommended answer. Be relentless about edge cases.
3. **Synthesize** — Summarize Why / What / Constraints when plan is solid.
4. **Spec** — Create `docs/specs/<slug>.md` (English only) only after **✅ แผนโอเคแล้ว**.
5. **Dashboard** — Add a `Draft` entry to `docs/README.md`.
   - Format: `[Feature Name]` (`Status`) — [View Spec](./specs/<slug>.md) — `[Date]`

## Rules

- **Hard Gate**: No Spec until user sends **✅ แผนโอเคแล้ว**.
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
