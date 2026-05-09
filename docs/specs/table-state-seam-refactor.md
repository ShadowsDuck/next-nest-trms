## Why

The `employees`, `courses`, and `audit-logs` list modules duplicate the same table-state responsibilities across separate feature hooks: URL query parsing, column filter mapping, pagination synchronization, query-state shaping, and loading-state handling. That duplication keeps each module shallow and spreads behavior changes across multiple files.

This refactor deepens the table-state seam without changing UI behavior. The goal is to centralize the repeated logic behind a small set of pure helpers and per-feature config while keeping each feature-owned hook readable and explicit.

## What

Refactor the logic layer for the `employees`, `courses`, and `audit-logs` table modules in `apps/web` so that:

- each feature keeps its existing `use-*-table-controller` hook
- shared table-state behavior moves into pure helper modules plus feature config objects
- URL query format remains backward-compatible for all three pages
- UI component structure stays in place except for minimal call-site updates required to use the new seam

## Constraints

- Must: keep the refactor limited to `employees`, `courses`, and `audit-logs`
- Must: keep existing URL query keys and serialized values unchanged
- Must: keep feature hooks as the public interface used by component layer
- Must: use simple `pure functions + config objects`, not a generic mega-hook
- Must Not: refactor `apps/web/shared/components/niko-table/**`
- Must Not: refactor `packages/ui/**`
- Must Not: introduce hook-over-hook abstractions
- Must Not: restructure table or toolbar UI beyond minimal seam adoption
- Out of Scope: adding support for new table pages, changing API response shapes, or changing search/filter UX

## Execution Strategy

- Branch: `codex/table-state-seam-refactor`
- Commit Policy: `do` proposes one short commit message per task; actual commits happen in final integration
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: inspect the three existing controller hooks, extract repeated pure logic, and update the hooks to consume the new seam
- Agent-doable: add or update focused tests for extracted pure logic where existing coverage is missing
- User-required: none

## Tasks

T1 — Inventory the duplicated table-state responsibilities across `employees`, `courses`, and `audit-logs`, then define the minimal seam split between shared pure logic and per-feature config · File: `apps/web/features/employees/hooks/use-employee-table-controller.ts`, `apps/web/features/courses/hooks/use-course-table-controller.ts`, `apps/web/features/audit-logs/hooks/use-audit-log-table-controller.ts` · Verify: the implementation plan identifies only logic-layer responsibilities and does not move UI concerns into the seam

T2 — Extract shared pure helpers for repeated table-state behavior such as param-to-filter normalization, filter-state comparison, pagination/meta shaping, and active-filter detection · File: `apps/web/shared/lib/table-filter-utils.ts` or a new adjacent shared logic file under `apps/web/shared/lib/` · Verify: `pnpm --filter web lint` passes and extracted helpers do not import React or feature modules

T3 — Add per-feature config objects or helper modules for `employees`, `courses`, and `audit-logs` to describe their filter keys, column-id mapping, and allowed values without changing serialized URL format · File: `apps/web/domains/employees/lib/search-params.ts`, `apps/web/domains/courses/lib/search-params.ts`, `apps/web/domains/audit-logs/lib/search-params.ts`, plus any new feature-local config files if needed · Verify: existing query-string shape for each page remains unchanged when compared against current parser/serializer behavior

T4 — Update the three existing controller hooks to consume the new seam while remaining the only hooks used by the component layer · File: `apps/web/features/employees/hooks/use-employee-table-controller.ts`, `apps/web/features/courses/hooks/use-course-table-controller.ts`, `apps/web/features/audit-logs/hooks/use-audit-log-table-controller.ts` · Verify: `pnpm --filter web typecheck` passes and no new shared React hook is introduced

T5 — Apply only the minimal component call-site updates required by the hook return shapes or imports, without restructuring UI modules · File: `apps/web/features/employees/components/employee-table.tsx`, `apps/web/features/courses/components/course-table.tsx`, `apps/web/features/audit-logs/components/audit-log-table.tsx`, and any directly affected toolbar component files · Verify: diff in component files is limited to seam adoption and preserves existing props/UI flow

T6 — Add focused regression coverage for the extracted pure table-state logic and run final web verification · File: tests adjacent to the extracted shared logic or existing web test locations · Verify: `pnpm --filter web lint` and `pnpm --filter web typecheck` pass, and the added tests cover backward-compatible query/filter behavior for all three features
