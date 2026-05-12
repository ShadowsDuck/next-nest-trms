---
name: hono-project-structure
description: >
  File placement and naming guide for this Hono + Prisma + Kysely backend,
  organized by Domain Module. Read this skill BEFORE creating any file, adding
  any endpoint, scaffolding any feature, or deciding where code belongs.
  Trigger on: "add a route", "create a controller", "new feature", "new endpoint",
  "scaffold", "add an entity", "where do I put", or any time code files are about
  to be created. For Hono API syntax → use the `hono` skill instead.
---

# Hono Project Structure — Domain Module

**Core principle:** Every file that belongs to a domain lives inside that domain's folder.
Opening `src/modules/order/` tells you everything the order domain does — handlers, queries,
services, schema, and tests — without jumping across the codebase.

---

## Naming Conventions

| Context                                  | Convention   | Example                             |
| ---------------------------------------- | ------------ | ----------------------------------- |
| Folders & files                          | `kebab-case` | `create-order.ts`                   |
| Classes & Types                          | `PascalCase` | `CreateOrderBody`, `OrderSchema`    |
| Functions, Zod schemas                   | `camelCase`  | `createOrderHandler`, `orderSchema` |
| DB tables, columns, request/query params | `snake_case` | `user_id`, `created_at`             |

---

## Project Layout

```
src/
├── app.ts                  # Bootstrap: init Hono app, register global middleware, mount routes
├── server.ts               # Node.js entry point
├── env.ts                  # Zod-validated environment variables
│
├── modules/                # ← Domain modules (core of the app)
│   ├── index.ts            # Mount all module routes into the app
│   └── <domain>/           # One folder per business domain
│       ├── index.ts        # Export: routes for this domain
│       ├── <domain>.schema.ts      # Zod schema, types, OpenAPI registration
│       ├── <domain>.routes.ts      # Register all handlers for this domain
│       ├── handlers/               # HTTP layer — one file per endpoint
│       │   ├── create-<domain>.ts
│       │   ├── get-<domain>.ts
│       │   ├── get-<domain>s.ts
│       │   ├── update-<domain>.ts
│       │   ├── delete-<domain>.ts
│       │   └── search-<domain>s.ts
│       ├── queries/                # DB queries — one file per operation
│       │   ├── create-<domain>.query.ts
│       │   ├── get-<domain>.query.ts
│       │   ├── update-<domain>.query.ts
│       │   ├── delete-<domain>.query.ts
│       │   └── search-<domain>s.query.ts
│       ├── services/               # Business logic — only when needed
│       │   └── <operation>-<domain>.service.ts
│       └── __tests__/              # All tests for this domain
│           ├── <domain>.handlers.test.ts
│           ├── <domain>.queries.test.ts
│           └── __fixtures__/       # Fake data factories for tests
│               └── make-fake-<domain>.ts
│
├── db/                     # Kysely client + Prisma-generated types
│   ├── create-db-client.ts
│   └── schema.ts           # Override Prisma types for app use
│
├── middleware/             # Global middleware (auth, logging, error handling)
│   └── <name>.middleware.ts
│
├── lib/                    # Third-party integrations (e.g. better-auth, storage)
├── types/
│   └── hono.ts             # HonoEnv, AppRouteHandler — always import from here
├── constants/              # App-wide constants
└── utils/                  # Pure stateless helpers (errors, pagination, etc.)
```

---

## Anatomy of a Domain Module

Every domain is self-contained. Example: `modules/order/`

```
modules/order/
├── index.ts                    # export { orderRoutes } from './order.routes'
├── order.schema.ts             # Zod schema + OpenAPI + derived types
├── order.routes.ts             # .openapi(createOrderRoute, createOrderHandler) ...
├── handlers/
│   ├── create-order.ts         # parse → call query or service → return JSON
│   ├── get-order.ts
│   ├── get-orders.ts
│   ├── update-order.ts
│   └── delete-order.ts
├── queries/
│   ├── create-order.query.ts   # Kysely insert
│   ├── get-order.query.ts      # Kysely select
│   ├── update-order.query.ts
│   └── delete-order.query.ts
├── services/
│   └── place-order.service.ts  # orchestrates: validate stock → create order → notify
└── __tests__/
    ├── order.handlers.test.ts
    ├── order.queries.test.ts
    └── __fixtures__/
        └── make-fake-order.ts
```

---

## Responsibility of Each Layer

### handlers/ — HTTP only

- Parse validated input (`c.req.valid(...)`)
- Call **query** (simple) or **service** (complex)
- Return typed JSON with correct status code
- **No business logic, no raw DB calls**

### queries/ — DB only

- Pure Kysely queries, no HTTP context
- One function per operation, always export a `Response` type
- Use `executeTakeFirstOrThrow(() => new NotFoundError(...))` for single-record ops

### services/ — Orchestration only

- Use when a handler needs **multiple queries** or **cross-domain logic**
- Receive dependencies as injected args (easier to test)
- If the operation is one query → skip service, call query directly from handler

### `<domain>.schema.ts` — Single source of truth for types

- Zod schema for the entity
- OpenAPI registration
- Derived types: `Create<Domain>`, `Update<Domain>`, `<Domain>Response`

### `__tests__/` — Co-located with the domain

- Tests live next to the code they test, not in a separate top-level `tests/` folder
- `__fixtures__/make-fake-<domain>.ts` creates realistic fake data for tests

---

## What Goes in Global Folders

Only code with **zero domain knowledge** belongs outside `modules/`:

| Folder        | Belongs Here                                        | Does NOT Belong Here      |
| ------------- | --------------------------------------------------- | ------------------------- |
| `middleware/` | Auth check, request logging, error handler          | Order-specific validation |
| `utils/`      | `paginate()`, `toISOString()`, custom Error classes | Any domain concept        |
| `lib/`        | Stripe client init, S3 client init                  | Payment business logic    |
| `constants/`  | HTTP status codes, env keys                         | Domain-specific enums     |
| `db/`         | Kysely setup, Prisma type overrides                 | Any query                 |

If you find yourself importing a domain module into `utils/`, the code is in the wrong place.

---

## Decision Tree: Where Does New Code Go?

```
New code needed?
│
├─ Belongs to a specific domain? (user, order, product...)
│   │
│   ├─ HTTP handler (parse input, return response)?
│   │   └─ src/modules/<domain>/handlers/<operation>-<domain>.ts
│   │
│   ├─ DB query?
│   │   └─ src/modules/<domain>/queries/<operation>-<domain>.query.ts
│   │
│   ├─ Multi-step business logic (multiple queries / cross-domain)?
│   │   └─ src/modules/<domain>/services/<operation>-<domain>.service.ts
│   │
│   ├─ Zod schema / types for this domain?
│   │   └─ src/modules/<domain>/<domain>.schema.ts
│   │
│   └─ Test or fake data?
│       └─ src/modules/<domain>/__tests__/
│
└─ No domain (truly shared)?
    ├─ Global middleware?  →  src/middleware/
    ├─ Pure helper fn?     →  src/utils/
    ├─ 3rd party client?   →  src/lib/
    └─ App-wide constant?  →  src/constants/
```

---

## Checklist: Adding a New Domain

- [ ] Create `src/modules/<domain>/` folder
- [ ] `<domain>.schema.ts` — Zod schema, types, OpenAPI registration
- [ ] `queries/` — create operation files
- [ ] `handlers/` — create handler files
- [ ] `<domain>.routes.ts` — register handlers via `.openapi()`
- [ ] `index.ts` — export routes
- [ ] Register routes in `src/modules/index.ts`
- [ ] `__tests__/__fixtures__/make-fake-<domain>.ts` — fake data factory
- [ ] `__tests__/` — add handler + query tests
- [ ] `services/` — add only if orchestration is needed

---

## Key Types

```typescript
// Always import from here
import type { HonoEnv } from "@/types/hono";
import type { AppRouteHandler } from "@/types/hono";

// HonoEnv:         provides dbClient, session via Hono context
// AppRouteHandler: full type-safety for c.req / c.json()
```

---

## Implementation Details

For full code patterns and examples, read the rules files:

| Need                     | File                           |
| ------------------------ | ------------------------------ |
| Handler + route patterns | `rules/handlers-and-routes.md` |
| Query patterns (Kysely)  | `rules/queries.md`             |
| Service layer patterns   | `rules/services.md`            |
| Schema + type patterns   | `rules/schema.md`              |
| Prisma type overrides    | `rules/db-schema.md`           |
| Testing patterns         | `rules/testing.md`             |
