---
name: brief
description: The "Think & Draft" phase. Interview the user to refine the plan, find edge cases, and then generate an AI Spec in .ai/specs/ and update the dashboard.
---

# Brief

This skill handles the initial phase of any feature or fix. It combines deep thinking (grilling) with documentation (spec generation).

## Workflow

1.  **Understand**: Review the conversation and codebase.
2.  **Interview (Grill)**: Ask one question at a time to resolve ambiguities. Provide recommended answers. Be relentless about edge cases.
3.  **Synthesize**: Once the plan is solid, summarize the "Why", "What", and "Constraints".
4.  **Document (Spec)**: Create/Update the spec file in `.ai/specs/<slug>.md` using the SDD template.
5.  **Dashboard**: Update `docs/README.md` with the feature name, `Draft` status, and the link.

## Rules

- **Hard Rule**: Do NOT draft the Spec until you receive the "**✅ แผนโอเคแล้ว**" signal or explicit confirmation from the user that the plan is finalized.
- **One Question at a Time**: Ask only one question at a time with a recommended answer to avoid overwhelming the user.
- **Context First**: Always explore the codebase before asking a question. If you can find the answer yourself, do it.

## Spec Template Reminder

- **Why**: Problem/Motivation.
- **What**: Concrete deliverable.
- **Constraints**: Must (Thai comments, surgical), Must Not, Out of Scope.
- **Tasks**: T1, T2... with Verify steps.
