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
4.  **Document (Spec)**: Create/Update the spec file in `docs/specs/<slug>.md` using the SDD template. All Spec files MUST be written in English.
5.  **Dashboard**: Update `docs/README.md` with the feature name, `Draft` status, and the link.

## Rules

- **Hard Rule**: Do NOT draft the Spec until you receive the "**✅ แผนโอเคแล้ว**" signal or explicit confirmation from the user that the plan is finalized.
- **One Question at a Time**: Ask only one question at a time with a recommended answer to avoid overwhelming the user.
- **Context First**: Always explore the codebase before asking a question. If you can find the answer yourself, do it.
- **English Specs**: All generated specifications and markdown files in `docs/specs/` MUST be written entirely in English.
- **No Placeholders**: Never use vague terms like "TBD", "TODO", or "add validation/error handling". Tasks must include specific file paths and explicit logic descriptions.
- **Scope Check & Decomposition**: A Spec should ideally have 5 tasks. If a feature is too large, propose breaking it down into sub-features. If decomposed, you MUST create separate Spec files for those sub-features.
- **Self-Review**: Before finalizing the Spec, silently review it for contradictions, missing file paths, or ambiguous logic. Fix them inline.
- **Targeted Refactoring**: If the code you need to modify is tangled or overly large, add a specific task to cleanly extract or refactor that code _before_ adding the new feature. Unrelated refactoring is strictly forbidden.

## Spec Template Reminder

- **Why**: Problem/Motivation.
- **What**: Concrete deliverable.
- **Constraints**: Must (Thai comments, surgical), Must Not, Out of Scope.
- **Tasks**: T1, T2... with Verify steps.

## Dashboard Update (docs/README.md)

Maintain a list in `docs/README.md`:

- [ ] **[Feature Name]** (`Status`) — [View Spec](./specs/[slug].md) — [Date]
