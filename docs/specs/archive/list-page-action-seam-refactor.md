## Why

After the table-state refactor, the `employees` and `courses` list modules still duplicate the same action-shell responsibilities around row selection, export flows, summary report triggers, loading transitions, and table root wiring. The duplicated shell code keeps both modules shallow even though the logic layer behind table state has already been deepened.

This refactor deepens the list-page action seam without changing behavior. The goal is to concentrate the repeated page-shell behavior behind a small interface while keeping each feature responsible for its own data, columns, and feature-specific actions.

## What

Refactor the list-page action seam for `employees` and `courses` so that:

- repeated list-page action shell behavior moves behind a shared seam
- each feature provides its own config and handlers for export and summary-report actions
- existing table hooks remain feature-owned
- current selection behavior, export behavior, and summary-report flow remain unchanged

## Constraints

- Must: keep the refactor limited to `employees` and `courses`
- Must: preserve existing list-page UI flow and action behavior
- Must: keep feature table hooks and feature columns as feature-owned modules
- Must: use a simple shell/config seam, not a nested hook abstraction
- Must Not: include `audit-logs` in this round
- Must Not: refactor `apps/web/shared/components/niko-table/**`
- Must Not: redesign the list-page layout or toolbar UI
- Out of Scope: adding support for new list pages, changing export payloads, or changing summary-report navigation

## Execution Strategy

- Branch: `codex/architecture-seam-refactors`
- Commit Policy: `do` proposes one short commit message per task; actual commits happen in final integration
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: inspect the duplicated list-page shell and action flows, extract the minimal seam, and update employees and courses to consume it
- Agent-doable: add focused coverage for any extracted pure or component-level shell logic where current tests are missing
- User-required: none

## Tasks

T1 — Inventory the duplicated action-shell responsibilities shared by the employee and course list pages, and define the minimal seam split between shared shell behavior and feature-owned handlers/config · File: `apps/web/features/employees/components/employee-table.tsx`, `apps/web/features/courses/components/course-table.tsx`, `apps/web/features/employees/components/filter-toolbar.tsx`, `apps/web/features/courses/components/filter-toolbar.tsx` · Verify: the implementation plan isolates selection/export/report shell behavior without pulling feature data logic into the shared seam

T2 — Extract the repeated list-page action shell into a shared module that owns selection bar wiring, common loading transitions, and table-root composition responsibilities while remaining configurable per feature · File: a new shared module under `apps/web/shared/` or `apps/web/features/` adjacent to the current table pages, plus directly affected table files · Verify: `pnpm --filter web typecheck` passes and no new shared React hook is introduced

T3 — Move employee-specific and course-specific export/report handlers behind a feature-facing config or adapter shape so each feature still owns its distinct actions while the shell stays shared · File: `apps/web/features/employees/components/employee-table.tsx`, `apps/web/features/courses/components/course-table.tsx`, plus any new adjacent feature files if needed · Verify: feature-owned handler modules remain explicit and the shared seam does not import feature data modules directly

T4 — Apply only the minimal table and toolbar call-site updates needed to adopt the shared action shell without changing visible UI behavior · File: `apps/web/features/employees/components/employee-table.tsx`, `apps/web/features/courses/components/course-table.tsx`, and any directly affected toolbar or empty-state files · Verify: `pnpm --filter web lint` passes and the diff preserves current selection, export, and summary-report flows

T5 — Add focused regression coverage for extracted shell logic where feasible, then run final verification · File: tests adjacent to the new shared seam or existing web test locations · Verify: `pnpm --filter web typecheck`, `pnpm --filter web lint`, and any added tests pass with no behavioral change
