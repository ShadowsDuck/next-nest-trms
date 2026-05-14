---
name: to-spec
description: "The 'Synthesize & Spec' phase for feature planning. Use after grill-with-docs has already established what to build. Trigger on: 'write the spec', 'create the spec', 'to-spec this', '/to-spec', or when the user signals readiness to move from planning to a written spec. Do NOT interview the user — synthesize from the current conversation. Never write code."
---

# To-Spec

This skill reads what was already decided in the current conversation and turns it into a spec that `do` can execute without guessing. Do NOT re-interview the user — the grill session already happened.

## Context

Gather silently before doing anything:

```
- Current branch: $(git branch --show-current)
- Existing specs: $(ls docs/specs/ 2>/dev/null)
- Domain glossary: $(cat CONTEXT.md 2>/dev/null | head -60)
- Project conventions: $(cat AGENTS.md 2>/dev/null | head -100)
```

Also read relevant source files for the area being discussed.

---

## Workflow

1. **Read conversation** — extract all decisions, constraints, and edge cases resolved during the grill session
2. **Synthesize** — summarize and confirm scope with the user
3. **Branch Setup** — create and switch to feature branch
4. **Write spec** — only after receiving explicit confirmation
5. **Dashboard** — add a `Draft` entry to `docs/README.md`
6. **Commit** — stage only `docs/specs/<slug>.md` and `docs/README.md`

---

## Step 1: Read Conversation

Scan the current conversation for:

- What problem is being solved
- What the solution looks like
- Constraints and exclusions agreed upon
- Edge cases and error states discussed
- Data model, API contracts, authorization decisions
- Anything explicitly ruled out of scope

**If no grill session is found in the conversation** — stop and say: "ไม่เห็น grill session รัน grill-with-docs ก่อนนะ"

Do not ask questions that were already answered. Do not re-open decisions that were already closed.

---

## Step 2: Synthesize

Write a summary of what was decided:

```
## Why
<problem / motivation — 2-3 sentences>

## What
<concrete deliverable — what done looks like>

## How it works
<flow from user perspective — 3-5 bullet points>

## Constraints
- Must: <non-negotiables>
- Must Not: <explicit exclusions>
- Out of Scope: <things explicitly deferred>
```

Then ask: **`ตอบกลับด้วย ✅ แผนโอเคแล้ว`**

Do not proceed until that exact confirmation is received. If confirmation is ambiguous, ask again.

---

## Step 3: Branch Setup

After `✅ แผนโอเคแล้ว`, create and switch to the feature branch before writing any files:

```
git checkout -b <feature-slug>
```

If this fails, stop and report the blocker. Do not write files on the wrong branch.

---

## Step 4: Write Spec

Create `docs/specs/<feature-slug>.md`. Create `docs/specs/` if it doesn't exist.

### Spec template

```md
## Why

<problem / motivation — 2-3 sentences explaining the pain point>

## What

<concrete deliverable — what the feature looks like when done>

## How it works

<flow from user perspective — 3-5 bullet points>

## Constraints

- Must: Thai comments, surgical edits only
- Must Not: <list>
- Out of Scope: <list>

## Execution Strategy

- Commit Policy: one commit per phase; user stages and commits
- Merge Policy: run `ship` only when all phases are done and committed

## Prerequisites

- Agent-doable: <list>
- User-required: <list — credentials, env vars, manual steps>

## Phases

### Phase 1 — <Name> · Complexity: S/M/L

**Goal:** <one sentence — what this phase delivers>
**Touches:** <files or modules that will change>
**Tasks:**

- T1.1 — <action> · Verify: <concrete check or command>
- T1.2 — …

**Done when:** <verifiable criteria — not "looks good">
**Risk:** <what could go wrong, or "none">

### Phase 2 — <Name> · Complexity: S/M/L

…
```

### Spec rules

- Each task must have a `Verify` step concrete enough to gate a commit — not "check it works", but e.g. `pnpm typecheck --filter api` returns 0 errors
- No placeholders — "TBD" means `do` has to guess; guess wrong = wasted work
- List all external dependencies explicitly (DB state, env vars, API keys) — never imply them
- No opportunistic cleanup — add a phase only if it's required for the feature
- English only — specs may be read by agents or non-Thai speakers
- Each phase must leave the codebase in a working state — no phase should break the build
- Phases ordered by risk: schema/data changes first, UI last

---

## Step 5: Dashboard

After writing the spec, update `docs/README.md`. Create it if it doesn't exist.

Add a `Draft` entry under the specs index:

```
- [Feature Name](./specs/<slug>.md) (`Draft`) — <Date>
```

If a section for specs doesn't exist yet, add one:

```md
## Specs

- [Feature Name](./specs/<slug>.md) (`Draft`) — <Date>
```

---

## Step 6: Commit

Stage only `docs/specs/<slug>.md` and `docs/README.md`. Commit message:

```
docs: draft spec for <feature-slug>
```

Do not stage any other files. Do not commit implementation code.

---

## Hard Gates

Non-negotiable — if any is violated, state `Process violation in to-spec: <what was violated>`, stop, and ask whether to restart:

- **No spec before ✅** — writing a spec prematurely locks in unconfirmed assumptions
- **Branch before files** — everything written before the branch switch lands on the wrong branch
- **English-only specs** — `do` may run independently or be read by non-Thai agents
- **No placeholders** — TBD in a spec means `do` guesses; guesses cause rewrites

---

## After the commit

Print the spec file path and stop. Do not start implementation. The user will invoke `do` when ready.
