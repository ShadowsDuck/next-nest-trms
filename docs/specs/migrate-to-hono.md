## Why

The backend currently relies on NestJS, which introduces heavy OOP and decorator-based boilerplate that slows down both runtime performance and developer iteration. Migrating to Hono on Node.js provides a lighter, functional paradigm that runs faster and enables end-to-end type safety with the frontend via `hono/rpc`.

## What

A fully functional Hono backend replacing the NestJS API. The new backend will use `app.route()` to organize features by domain, replacing NestJS controllers and modules. Dependency injection will be replaced by direct global imports (for Prisma) and custom context middleware (for Better Auth). Endpoints will be validated using `@hono/zod-validator` integrating seamlessly with our existing `@workspace/schemas`.

## How it works

- The main `app` is initialized in `index.ts` using `@hono/node-server`.
- Prisma client is exported as a singleton and imported directly into services.
- A custom auth middleware extracts the user session from Better Auth and stores it via `c.set('user', user)`.
- Each feature domain (e.g., users, courses) has its own `router.ts` mounting handlers.
- Handlers validate inputs via `zValidator` and rely on plain functional services for business logic.

## Constraints

- Must: Thai comments only, Surgical edits
- Must: Retain the `modules/` directory structure for domain organization
- Must Not: Break or modify any schema definitions in `@workspace/schemas`
- Out of Scope: Implementing `hono/rpc` client integration in the Next.js frontend

## Execution Strategy

- Branch: `codex/migrate-to-hono`
- Commit Policy: One commit message per task
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: Install Hono dependencies, refactor modules, setup global Prisma and Auth middleware.
- User-required: N/A

## Tasks

T1 — Update API dependencies (remove `@nestjs/*`, add `hono`, `@hono/node-server`, `@hono/zod-validator`) · File: `apps/api/package.json` · Verify: `pnpm install` succeeds
T2 — Setup global Prisma singleton · File: `apps/api/src/lib/db.ts` · Verify: File exports `db` using `@workspace/database`
T3 — Setup Better Auth instance & middleware · File: `apps/api/src/middlewares/auth.ts` · Verify: Middleware uses `better-auth` and sets `user` in context
T4 — Refactor foundational modules (health, users, tags) to Hono routers · File: `apps/api/src/modules/*/router.ts` · Verify: Files compile without syntax errors
T5 — Refactor core business modules (employees, courses) to Hono routers · File: `apps/api/src/modules/*/router.ts` · Verify: Files compile without syntax errors
T6 — Refactor analytical modules (audit-logs, organization-units, summary-reports) · File: `apps/api/src/modules/*/router.ts` · Verify: Files compile without syntax errors
T7 — Wire up routers in main app and start server · File: `apps/api/src/index.ts` · Verify: `pnpm --filter api run build` completes successfully
