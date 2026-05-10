---
name: brief
description: The "Think & Draft" phase for feature planning. Use this skill whenever a user wants to plan, scope, or design a new feature — even if they don't say "brief". Trigger on phrases like "I want to build X", "let's plan this", "help me scope", "new feature idea", "write a spec", or when someone describes a problem they want solved. This skill interviews the user, refines requirements, then produces a spec and git branch — stopping before any code is written.
---

# Brief

Planning is cheaper than debugging. This skill exists to surface assumptions, resolve ambiguities, and produce a spec that `do` can execute without guessing.

## Workflow

1. **Understand** — Explore the codebase first. Look at relevant files, existing patterns, and the current state of `docs/README.md`. This context shapes every question you ask.
2. **Grill** — Ask one question at a time, always include a recommended answer, and probe edge cases until decisions are concrete. Rushing through questions produces specs that fall apart during implementation.
3. **Synthesize** — Once the scope is clear, summarize the Why / What / Constraints and ask for explicit confirmation.
4. **Branch Setup** — Create and switch to the feature branch _before_ writing any files. Branch format: `codex/<feature-slug>`. If this fails, stop and report the blocker — writing files on the wrong branch creates drift that's hard to clean up.
5. **Spec** — Create `docs/specs/<slug>.md` only after receiving **✅ แผนโอเคแล้ว**.
6. **Dashboard** — Add a `Draft` entry to `docs/README.md`:
   - Format: `[Feature Name]` (`Draft`) — [View Spec](./specs/<slug>.md) — `[Date]`
7. **Commit** — Stage only `docs/specs/<slug>.md` and `docs/README.md`. Commit message: `docs: draft spec for <feature-slug>`.
8. **Stop** — Hand off to `do`. No code, no scaffolding, no "just a quick fix".

## Interaction Protocol

Follow this order exactly — the structure exists because skipping steps leads to implementation that doesn't match what the user actually wanted:

1. Read relevant codebase context.
2. Ask one question (with recommended answer). Wait.
3. Repeat until scope is fully concrete.
4. Write the Why / What / Constraints summary.
5. Ask: `ตอบกลับด้วย ✅ แผนโอเคแล้ว`
6. Wait for that exact confirmation.
7. Create/switch branch.
8. Write spec + dashboard.
9. Commit docs only. Stop.

Do not jump from questions to implementation. Do not combine `brief` and `do` in one execution. Do not proceed when confirmation is missing or ambiguous.

## Hard Gates

These are non-negotiable because violations corrupt the trust between planning and execution:

- **No spec before ✅** — Writing a spec prematurely locks in assumptions the user hasn't confirmed.
- **Branch before files** — Everything written before the branch switch lands on `main`, which breaks the commit model.
- **English-only specs** — `do` and `ship` run independently and may be used by non-Thai speakers or automated agents. Thai in specs causes misreads.
- **No placeholders** — "TBD" in a spec means `do` has to guess. Guess wrong = wasted work.

If any gate is violated, explicitly state: `Process violation in brief: <what was violated>`, stop, and ask the user whether to restart from Step 1.

## Grill Rules

Interview the user relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

- One question at a time. Multiple questions let users skip the hard ones.
- Always include a recommended answer. It anchors the discussion and shows you've thought it through.
- Probe edge cases: what happens when X fails? What if the user has no data yet? What's the rollback?
- If a question can be answered by exploring the codebase, explore the codebase instead of asking.

## Spec Rules

- **7 tasks max** (soft limit). If more are needed, split into separate spec files. Large specs produce large PRs that nobody reviews properly.
- Each task must have a `Verify` step concrete enough to gate a commit — not "check it works", but "run `pnpm typecheck --filter api` and confirm 0 errors".
- List all external dependencies explicitly (DB state, credentials, API keys, buckets). Never imply them.
- Add a refactor task only if it's required for the feature. No opportunistic cleanup.

## Spec Template

```md
## Why

<problem / motivation — 2-3 sentences explaining the pain point>

## What

<concrete deliverable — what the feature looks like when done>

## How it works

<brief description of the flow from user perspective — 3-5 bullet points>

## Constraints

- Must: Thai comments, surgical edits only
- Must Not: <list>
- Out of Scope: <list>

## Execution Strategy

- Branch: `codex/<feature-slug>`
- Commit Policy: if batching tasks, `do` proposes one summary commit message; if executing individually, one commit message per task
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: <list>
- User-required: <list>

## Tasks

T1 — <action> · File: `<path>` · Verify: <command or check>
T2 — …
```
