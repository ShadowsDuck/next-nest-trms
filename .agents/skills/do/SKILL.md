---
name: do
description: "The 'Execute' phase. Implement phases from a spec file one at a time — surgical, reviewable, never committing until the user decides. Trigger when the user says 'do Phase 1', 'implement phase 2', 'next phase', 'start building', 'execute the spec', or references any phase from a spec. Always reads the spec first. Never stages or commits."
---

# Do

This skill assumes `to-spec` has already produced a spec in `docs/specs/<feature>.md`. Read the spec carefully before touching any code — execution without that foundation creates drift.

## Code Convention

Every new function must have a **Thai comment** stating what it is responsible for. No exceptions.

---

## Startup

1. Find the spec in `docs/specs/`. If the user didn't specify which spec, ask — don't guess.
2. If no spec exists: "No spec found in `docs/specs/`. Run `to-spec` first."
3. **Branch check** — confirm current branch matches the spec. If mismatch, stop and report before writing anything.
4. Confirm which phase to start (default: first incomplete phase). State it in one line and begin.

---

## Execution Loop

For each phase:

### 1. Announce

One line: `Starting Phase N — <Name>: <goal>`

### 2. Pre-flight

Read every file the phase will touch before writing anything. The spec describes intent; the codebase describes reality. Resolve gaps before starting, not halfway through.

Stop and report if:

- A dependency is missing from the codebase
- The spec conflicts with current code state
- A task instruction is ambiguous

### 3. Implement

Touch only the files listed in the phase. No unrelated refactors, no opportunistic cleanup. If you notice an improvement outside scope, note it in the report as future work — don't fix it now.

**Scope creep is a blocker.** If implementing this phase requires changes scoped to a future phase, stop and flag the dependency instead of blending phases.

### 4. Verify

Run the phase's verify steps. If a verify instruction is vague, define the smallest concrete check that proves completion before writing code — not after.

If verify fails: report the failure and stop. Do not proceed.

### 5. Report

Only include fields that have something to say — drop empty ones:

```
## ✅ Phase N done — <Name>

**What changed**
<1–3 sentences>

**Files**
- `path/to/file.ts` — <what changed and why>

**Notes for reviewer**
<non-obvious decisions, tradeoffs, things to watch in the diff>

**Future work noted**
<improvements spotted but out of scope>
```

Then stop. No "ready for Phase N+1?" — just stop. The user will proceed when ready.

---

## Rules

**Never stage or commit.** No `git add`, `git commit`, `git stash`, or any git write operation. Read-only git only: `git status`, `git diff`, `git log`. The user owns all commit decisions.

**One phase at a time.** Even if the next phase is trivial — stop and wait.

**Surgical edits only.** If you wouldn't include it in this phase's diff, don't write it now.

**No silent assumptions.** If the spec is ambiguous about something that affects how you write code, ask before writing.

**Follow AGENTS.md.** Respect code style, naming conventions, import style. If absent, match existing code exactly.

---

## Mid-phase Discoveries

If something unexpected blocks the current approach:

1. Stop immediately — don't improvise
2. State what the spec assumed vs. what's actually true
3. State the impact — does this affect just this phase, or future phases too?
4. Propose 2–3 concrete options
5. Wait for a decision before writing any more code
