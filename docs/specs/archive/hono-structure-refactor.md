## Why

The current backend (`apps/api/src/`) was migrated from NestJS to Hono but retained the old file layout: HTTP handlers are inline in `router.ts`, DB queries and business logic are merged inside `*.service.ts`, the entry point mixes bootstrap with server start, and environment variables are accessed raw. This makes individual layers hard to test, import chains hard to trace, and onboarding harder than it needs to be. The `hono-project-structure` skill defines a clear domain-module pattern that resolves all of these issues.

## What

Restructure `apps/api/src/` across all 8 domain modules so that every file has exactly one responsibility:

- HTTP parsing lives in `handlers/`
- Prisma calls live in `queries/`
- Orchestration lives in `services/`
- The app bootstrap is separate from the server entry point
- Environment variables are Zod-validated at startup

## How it works

- `index.ts` is split into `app.ts` (Hono init + middleware + route mounting) and `server.ts` (Node `serve()` call)
- `env.ts` is created to parse and validate `process.env` with Zod; all code imports from `env.ts` instead of touching `process.env` directly
- `lib/factory.ts` is removed; `AppEnv` (renamed `HonoEnv`) moves to `types/hono.ts`
- `middlewares/` is renamed to `middleware/` and the file is renamed to `auth.middleware.ts`
- `lib/builder-utils.ts` and `lib/date-utils.ts` move to `utils/`
- `auth/auth.ts` moves to `lib/auth.ts`
- A `modules/index.ts` is created to mount all domain routes in one place
- For each of the 8 domains, `router.ts` is split: inline handlers → `handlers/<op>-<domain>.ts`, and `*.service.ts` is split into `queries/<op>-<domain>.query.ts` + `services/<op>-<domain>.service.ts`
- Domain-internal `lib/` and named sub-folders (e.g., `storage/`) stay co-located inside the domain

## Constraints

- Must: Thai comments on every new function, surgical edits only — no business logic changes
- Must Not: alter API behavior, response shapes, or HTTP status codes; touch `@workspace/schemas`; modify the Prisma schema
- Out of Scope: writing tests, adding `__tests__/` or `__fixtures__/`, moving schemas out of the shared package

## Execution Strategy

- Branch: `codex/hono-structure-refactor`
- Commit Policy: one commit per task (T1–T7)
- Merge Policy: run `ship` only when all tasks are done and `pnpm typecheck --filter api` passes with 0 errors

## Prerequisites

- Agent-doable: all file moves and rewrites
- User-required: none

## Tasks

T1 — Split `src/index.ts` into `src/app.ts` + `src/server.ts`, and create `src/env.ts` (Zod-validated env) · Files: `src/app.ts`, `src/server.ts`, `src/env.ts` (delete `src/index.ts`) · Verify: `pnpm typecheck --filter api` passes, dev server starts

T2 — Move `AppEnv` → `src/types/hono.ts` as `HonoEnv`; remove `src/lib/factory.ts`; rename `src/middlewares/` → `src/middleware/` and rename file to `auth.middleware.ts`; move `src/auth/auth.ts` → `src/lib/auth.ts`; move `src/lib/builder-utils.ts` + `src/lib/date-utils.ts` → `src/utils/` · Verify: `pnpm typecheck --filter api` passes, no dead imports

T3 — Create `src/modules/index.ts` to mount all domain routes; add `index.ts` to each domain folder exporting its routes · Files: `src/modules/index.ts`, `src/modules/*/index.ts` · Verify: routes respond correctly, typecheck passes

T4 — Refactor `courses` domain: split `router.ts` → `courses.routes.ts` + `handlers/create-course.ts` + `handlers/get-courses.ts`; split `courses.service.ts` → `queries/create-course.query.ts` + `queries/get-courses.query.ts` + `queries/get-courses-for-report.query.ts` + `services/create-course.service.ts`; add `courses.schema.ts` (re-export + augment from `@workspace/schemas`) · Verify: POST `/api/courses` and GET `/api/courses` work, typecheck passes

T5 — Refactor `employees` domain: split `router.ts` → `employees.routes.ts` + `handlers/`; split `employees.service.ts` → `queries/` + `services/`; split `employee-import.service.ts` → `services/import-employees.service.ts`; add `employees.schema.ts` · Verify: all employee endpoints work, typecheck passes

T6 — Refactor `organization-units`, `audit-logs`, and `summary-reports` domains using the same pattern (routes, handlers, queries, services, schema) · Verify: all endpoints work, typecheck passes

T7 — Refactor `health`, `tags`, and `users` domains (simpler modules — routes + handlers + queries only, no services needed) · Verify: all endpoints work, `pnpm typecheck --filter api` shows 0 errors, dev server starts cleanly
