---
name: brief
description: The "Think & Draft" phase. Interview the user, refine the plan, find edge cases, then generate a Spec in docs/specs/ and update the dashboard.
---

# Brief

## Workflow

1. **Understand** — Explore the codebase before asking anything.
2. **Grill** — Use grill-me behavior strictly: one question at a time, recommended answer, and relentless edge-case probing.
3. **Synthesize** — Summarize Why / What / Constraints when plan is solid.
4. **Spec** — Create `docs/specs/<slug>.md` (English only) only after **✅ แผนโอเคแล้ว**.
5. **Dashboard** — Add a `Draft` entry to `docs/README.md`.
   - Format: `[Feature Name]` (`Status`) — [View Spec](./specs/<slug>.md) — `[Date]`
6. **Stop** — Do not implement code. Hand off to `do` after the spec and dashboard are ready.

## Rules

- **Hard Gate**: No Spec until user sends **✅ แผนโอเคแล้ว**.
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

## Tasks

T1 — <action> · File: `<path>` · Verify: <command or check>
T2 — …
```
