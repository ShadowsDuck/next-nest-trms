---
name: hono-project-structure
description: >
  Project structure map and file placement guide for this Hono + Prisma + Kysely backend.
  Use this skill whenever you are about to create a new file, add a new resource/endpoint,
  scaffold a feature, or are unsure where to place code in this project. Trigger on phrases
  like "add a route", "create a controller", "new feature", "new endpoint", "where do I put",
  "scaffold", "add an entity", or any time code files are about to be created.
  This is NOT a general Hono syntax guide — for Hono API syntax use the `hono` skill instead.
---

# Hono Project Structure Guide

This skill is the **single source of truth for file placement and naming** in this project.
Always consult it before creating or moving files.

For Hono API syntax (routing, middleware, streaming, RPC) → use the **`hono` skill** instead.
For deeper implementation patterns → read the relevant `rules/` file listed in each section below.

---

## Naming Conventions (Apply Everywhere)

| Context                                        | Convention    | Example                        |
| ---------------------------------------------- | ------------- | ------------------------------ |
| Folders & files                                | `kebab-case`  | `create-user.ts`               |
| Feature-specific modules                       | `_kebab-case` | `_controllers/`                |
| Classes & Types                                | `PascalCase`  | `HonoEnv`, `CreateUserBody`    |
| Functions, Zod schemas                         | `camelCase`   | `createUserData`, `userSchema` |
| DB tables, columns, query params, request body | `snake_case`  | `first_name`, `user_id`        |

---

## Project Layout

```
src/
├── app.ts                  # App bootstrap (OpenAPIHono, middleware, routes)
├── server.ts               # Standalone Node.js server entry
├── env.ts                  # Zod-validated environment variables
├── constants/              # Shared constants
├── controllers/            # API routes & handlers  ← see rules/controllers-and-routes.md
│   ├── <resource>/
│   │   ├── routes.ts           # Chain .openapi() calls for this resource
│   │   ├── create-<resource>.ts
│   │   ├── get-<resource>.ts
│   │   ├── get-<resource>s.ts
│   │   ├── update-<resource>.ts
│   │   ├── delete-<resource>.ts
│   │   ├── archive-<resource>.ts
│   │   ├── unarchive-<resource>.ts
│   │   ├── search-<resource>s.ts
│   │   └── dto/                # Request/response DTOs (if needed)
│   └── routes.ts           # Root: imports & exports all resource routes
├── data/                   # Data access layer  ← see rules/data-access-via-db.md
│   ├── <entity>/
│   │   ├── schema.ts           # Zod schema + OpenAPI registration
│   │   ├── create-<entity>.ts
│   │   ├── get-<entity>.ts
│   │   ├── update-<entity>.ts
│   │   ├── delete-<entity>.ts
│   │   ├── search-<entity>s.ts
│   │   └── __test-utils__/     # Fake data factories for tests
│   └── schema.ts           # Root: registers all entity schemas for OpenAPI
├── db/                     # Kysely client + Prisma schema types
├── lib/                    # Third-party integrations (e.g. better-auth)
├── middlewares/            # Hono middleware functions
├── services/               # Business logic (only when needed)  ← see rules/service-layer.md
│   └── <entity>/
│       └── <operation>-<entity>.ts
├── types/                  # Shared TypeScript types
│   └── hono.ts             # HonoEnv + AppRouteHandler
└── utils/                  # Shared utilities (errors, logger, etc.)
```

---

## Feature Domain (Optional — only when explicitly required)

Use `src/features/<feature-name>/` only when the requirement explicitly calls for feature isolation.
Shared domain (`src/`) is the **default**.

```
src/features/<feature-name>/
├── index.ts
├── _constants/
├── _controllers/
│   ├── routes.ts
│   └── dto/
├── _data/
│   └── schema.ts
├── _middlewares/       # (only if needed)
├── _services/          # (only if needed)
├── _types/
└── _utils/
```

---

## Decision Tree: Where Does New Code Go?

```
New code needed?
│
├─ New API endpoint?
│   └─ src/controllers/<resource>/       (read rules/controllers-and-routes.md)
│       ├─ Create the operation file: <operation>-<resource>.ts
│       ├─ Register in: src/controllers/<resource>/routes.ts
│       └─ Export from: src/controllers/routes.ts
│
├─ New DB query / data access?
│   └─ src/data/<entity>/               (read rules/data-access-via-db.md)
│       ├─ Create the operation file: <operation>-<entity>.ts
│       └─ Register schema in: src/data/schema.ts
│
├─ Complex business logic (multi-step, orchestration)?
│   └─ src/services/<entity>/           (read rules/service-layer.md)
│       └─ Use dependency injection pattern
│
├─ Middleware?
│   └─ src/middlewares/<name>.ts
│       └─ Register in src/app.ts with app.use()
│
├─ Constants?
│   └─ src/constants/<name>.ts
│
└─ New complete feature (isolated domain)?
    └─ src/features/<feature-name>/     (use _kebab-case prefix for sub-modules)
```

---

## Workflow Patterns

Choose based on operation complexity:

| Pattern       | Use When                         | Flow                                                             |
| ------------- | -------------------------------- | ---------------------------------------------------------------- |
| **Pattern 1** | Simple CRUD, single data call    | `Data Layer → Controller → App`                                  |
| **Pattern 2** | Complex logic, strict separation | `Data Layer → Service → Controller → App`                        |
| **Pattern 3** | Flexible (recommended default)   | Mix: call data layer directly or via service based on complexity |

---

## Key Types (Always Use These)

```typescript
// types/hono.ts — always import from here
import type { HonoEnv } from '@/types/hono';
import type { AppRouteHandler } from '@/types/hono';

// HonoEnv provides: session, dbClient in context variables
// AppRouteHandler<typeof myRoute> — type-safe route handler
```

---

## Adding a New Resource: Checklist

When adding a completely new resource (e.g. `orders`):

- [ ] **Data layer**: Create `src/data/orders/schema.ts` + operation files
- [ ] **Register schema**: Add to `src/data/schema.ts`
- [ ] **Controllers**: Create `src/controllers/orders/` with operation files
- [ ] **Resource routes**: Create `src/controllers/orders/routes.ts` (chain `.openapi()`)
- [ ] **Root routes**: Add `ordersRoutes` to `src/controllers/routes.ts`
- [ ] **Service** (if needed): Create `src/services/orders/<operation>.ts`
- [ ] **Tests**: Add `__test-utils__/` under the data folder

---

## Rules Files Reference

Read these for full implementation details and code examples:

| Topic                      | File                                 |
| -------------------------- | ------------------------------------ |
| Controllers & routes       | `rules/controllers-and-routes.md`    |
| Data access (DB queries)   | `rules/data-access-via-db.md`        |
| Data access (external API) | `rules/data-access-via-api.md`       |
| Service layer              | `rules/service-layer.md`             |
| DB schema design           | `rules/db-schema.md`                 |
| Testing data access        | `rules/testing-data-access-layer.md` |
