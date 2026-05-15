## Why

`fallow` analysis shows high code duplication (over 2,400 lines) across the workspace, primarily due to copy-pasting pure helper functions, validation schemas, and common data processing logic in table controllers and forms. This creates maintenance overhead and technical debt.

## What

Extract identified pure functions and schemas into shared utilities without creating complex new abstractions (hooks) or changing underlying business logic.

## Constraints

- Must: Thai comments, surgical edits only (only extract, do not refactor logic).
- Must Not: Create nested or "base" hooks.
- Out of Scope: Refactoring `niko-table` internals or other duplication not explicitly listed in tasks.

## Execution Strategy

- Branch: `codex/refactor-dupes-utilities`
- Commit Policy: `do` proposes one short commit message per task; actual commits happen in final integration
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: Check out the branch, create files, perform extractions, check `pnpm analyze` or `pnpm typecheck`.
- User-required: None.

## Tasks

T1 — Extract Date Utilities · File: `apps/web/shared/lib/date-utils.ts` · Verify: Move `parseIsoDate` and `toIsoDate` from `apps/web/features/courses/create/components/schedule-details-section.tsx` and `apps/web/features/employees/create/components/employment-info-section.tsx` into the new file, update imports, and run `pnpm typecheck --filter web` to ensure 0 errors.
T2 — Extract Table Filter Utilities · File: `apps/web/shared/lib/table-filter-utils.ts` · Verify: Move `getFilterValues`, `getNumericFilterValues`, `pickAllowed`, `columnFiltersKey`, `setFilterParam`, and `buildFilterParamsFromColumnFilters` (and any related common functions) from the 3 table controllers (`audit-log`, `course`, `employee`) into the new utility file, update imports, and run `pnpm typecheck --filter web`.
T3 — Extract Auth Schema · File: `apps/web/features/auth/schemas/auth-schema.ts` · Verify: Extract common `email` and `password` Zod validations from `login-form.tsx` and `signup-form.tsx`, use them to compose the form schemas, and run `pnpm typecheck --filter web`.
T4 — Extract API Builder Utilities · File: `apps/api/src/lib/builder-utils.ts` · Verify: Move `parseNumber` and date parsing functions from `audit-log-where.builder.ts` and `course-where.builder.ts` to the new utility file, update imports, and run `pnpm typecheck --filter api`.
