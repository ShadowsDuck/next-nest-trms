---
name: ship
description: The "Final Integration" phase. Verify, commit, and prepare a PR. Use this skill when a user says "ship it", "we're done", "ready to merge", "let's PR this", "check if everything is clean", or when all spec tasks are complete and the user wants to finalize the branch. Runs type checks and lints, audits the commit sequence, updates the dashboard, and generates a PR description.
---

# Ship

Ship is the quality gate between "it works on my machine" and "it's in the branch". By the time you run this, all `do` tasks should be done. Your job is to verify that's actually true and that the branch is clean enough to merge.

## Process

### 1. Verify

Identify the full change scope from the spec (e.g., `web`, `api`, shared packages). Run the smallest check set that covers everything that changed:

1. Task-specific or file-specific tests (preferred — fastest signal).
2. Typecheck for each affected target.
3. Lint for each affected target.

If a check can't be run locally (e.g., CI-only), note it explicitly — don't skip silently. If any runnable check fails, stop, report the error, and mark the branch as `Needs-fix`. Don't paper over failures.

### 2. Commit Sequence Review

A clean commit history is what makes PRs reviewable. Confirm:

- Work happened on the correct feature branch (matches the spec's branch name).
- Each task has exactly one commit (`1 task = 1 commit`). Combining tasks in one commit makes it impossible to revert cleanly.
- No unrelated files are mixed into task commits.
- If uncommitted required changes exist, list them and stop before declaring merge readiness.

### 3. Finalize Status

Report exactly one readiness level:

- `Pass` — all runnable checks passed; no known gaps.
- `Needs-fix` — a check failed or an unacceptable gap remains.

Include:

- Branch name and task-to-commit mapping.
- Any non-local checks that still need to run (e.g., CI, E2E tests).
- Merge recommendation: `ready to merge` / `ready for PR review only` / `not ready`.

### 4. Operational Handoff (Required)

```
Done by agent:
- <checks run and passed>

Not done / blocked:
- <failed checks or skipped steps>

User manual actions required:
- <explicit steps — never implied>

Commands intentionally not run:
- <command> — <reason>
```

### 5. Dashboard Finalization

Update `docs/README.md` status from `Draft` to `Completed` — but only when every spec task is done and committed. Partial completion stays `Draft`.

After updating, commit it immediately — leaving it uncommitted creates drift that confuses the next `ship` run:

- Stage only `docs/README.md`.
- Commit message: `docs: complete <feature-slug>`.
- Re-check `git status` after this commit before making your final readiness decision.

### 6. PR Description

Generate a ready-to-paste PR description in a markdown code block. The bilingual format is intentional — headers in English because GitHub tooling and most code review tools parse them; content in Thai because the team communicates in Thai and it makes reviews faster.

```markdown
## What

<สรุปฟีเจอร์ 1-2 บรรทัดเป็นภาษาไทย>

## Changes

<รายการ bullet สรุปการเปลี่ยนแปลงเป็นภาษาไทยจาก task commits>
```

Do not include a `Manual steps required` section — manual steps belong in the Operational Handoff, not the PR description.
