---
name: hono-project-structure
description: >
  File placement and naming guide for this Hono + Prisma backend,
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

| Context                                  | Convention   | Example                          |
| ---------------------------------------- | ------------ | -------------------------------- |
| Folders & files                          | `kebab-case` | `summary-reports.handlers.ts`    |
| Classes & Types                          | `PascalCase` | `CreateOrderBody`, `OrderSchema` |
| Functions, Zod schemas                   | `camelCase`  | `createOrder`, `orderSchema`     |
| DB tables, columns, request/query params | `snake_case` | `user_id`, `created_at`          |

### File naming within a domain

- `<domain>.handlers.ts` — plural: contains a **collection** of handler functions
- `<domain>.service.ts` — singular: represents the business logic **module** for this domain
- `<domain>.query.ts` — singular: represents the data access **module** for this domain
- `<domain>.schema.ts` — singular: the single source of truth for types and validation

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
│       ├── <domain>.routes.ts      # Chained route definitions for this domain
│       ├── handlers/
│       │   └── <domain>.handlers.ts    # All HTTP handlers grouped in one file
│       ├── queries/
│       │   └── <domain>.query.ts       # All DB queries grouped in one file
│       ├── services/                   # Only when orchestration is needed
│       │   └── <domain>.service.ts     # Business logic for this domain
│       ├── lib/                        # Domain-specific helpers (mappers, builders)
│       │   ├── <domain>.mapper.ts      # Format DB rows → response types
│       │   └── <domain>-where.builder.ts  # Build Prisma `where` from query params
│       ├── <concept>/              # Named sub-folder when a complex concept has 3+ related files
│       │   ├── index.ts            # Single export point for the sub-module
│       │   └── ...                 # Internal helpers, kept private to this folder
│       └── __tests__/              # All tests for this domain
│           ├── <domain>.handlers.test.ts
│           ├── <domain>.queries.test.ts
│           └── __fixtures__/       # Fake data factories for tests
│               └── make-fake-<domain>.ts
│
├── lib/db.ts               # Prisma client — export `db` ให้ทุก query ใช้
│
├── middleware/             # Global middleware (auth, logging, error handling)
│   └── <name>.middleware.ts
│
├── lib/                    # Third-party integrations (e.g. better-auth, storage)
├── types/
│   └── hono.ts             # HonoEnv, JsonContext, JsonWithParamContext, QueryContext
├── constants/              # App-wide constants
└── utils/                  # Pure stateless helpers (errors, pagination, etc.)
```

---

## Anatomy of a Domain Module

Every domain is self-contained. Default layout for a CRUD domain: `modules/order/`

```
modules/order/
├── index.ts                    # export { orderRoutes } from './order.routes'
├── order.schema.ts             # Zod schema + derived types
├── order.routes.ts             # Chained factory route definitions
├── handlers/
│   └── order.handlers.ts       # getOrder, createOrder, updateOrder, deleteOrder
├── queries/
│   └── order.query.ts          # getOrderById, createOrder, updateOrder, deleteOrder
├── services/                   # Add only when orchestration is needed
│   └── order.service.ts        # placeOrder — orchestrates: validate stock → create → notify
├── lib/                        # Domain-specific helpers — NOT shared globally
│   ├── order.mapper.ts         # DB row → OrderResponse
│   └── order-where.builder.ts  # query params → Prisma WhereInput
├── shipping/                   # Sub-folder when 3+ files share one concept
│   ├── index.ts                # exports calculateShipping()
│   ├── get-courier-cost.ts
│   ├── calculate-packaging-cost.ts
│   └── calculate-discount.ts
└── __tests__/
    ├── order.handlers.test.ts
    ├── order.queries.test.ts
    └── __fixtures__/
        └── make-fake-order.ts
```

### The grouped-file default

**Files are navigation units — not operation units.**

For a standard CRUD domain, all handlers belong in one file and all queries belong in one file:

```ts
// handlers/order.handlers.ts
export async function getOrderById(c: ...) {}
export async function createOrder(c: ...) {}
export async function updateOrder(c: ...) {}
export async function deleteOrder(c: ...) {}
```

Splitting into `create-order.ts`, `get-order.ts`, `delete-order.ts` is premature fragmentation.
It increases context-switching, multiplies import lines, and provides no benefit until the file
becomes genuinely hard to navigate (> ~200 lines is a reasonable signal).

**When to split a grouped file into multiple files:**

- The file is growing beyond ~200 lines of actual logic
- There are distinct subdomains (e.g. `order-fulfillment.handlers.ts` vs `order-returns.handlers.ts`)
- The operations have fundamentally different concerns that don't benefit from being co-located

---

> **Hono Syntax:** For `createFactory`, `zValidator`, RPC chaining, and all Hono API syntax → use the `hono` skill.
> This skill covers only project-specific structural rules.

---

## Responsibility of Each Layer

### handlers/ — HTTP only

- Parse validated input (`c.req.valid(...)`)
- Call **query** (simple) or **service** (complex)
- Return `c.json()` with correct status code
- **No business logic, no raw Prisma calls**

Handlers should be thin. No try-catch. Let errors bubble to the global `.onError()` handler.
Services and queries throw `HTTPException` or custom error classes — the global handler formats the response.

Prefer `JsonContext<T>`, `JsonWithParamContext<T, P>`, `QueryContext<T>` from `@/types/hono`
over the generic `Context<HonoEnv>` when the handler has a validated input shape.

### queries/ — DB only

- Pure Prisma queries — no HTTP context
- Prisma does not throw on not-found — check `null` after `findUnique` and throw `NotFoundError` yourself
- Use precise `select` or `include` — avoid over-fetching
- Export reusable functions; services and handlers import from here

### services/ — Orchestration only

- Use only when a handler needs **multiple queries** or **cross-domain logic**
- Services throw `HTTPException` or custom errors — not raw `Error`
- If the operation is one query → call the query directly from the handler; skip the service layer

### `<domain>.schema.ts` — Single source of truth for types

- Zod schemas for validation
- Derived TypeScript types: `Create<Domain>`, `Update<Domain>`, `<Domain>Response`

### Path param validation

Validate path params at the router boundary using `zValidator('param', ...)`:

```ts
.get('/:order_id', zValidator('param', z.object({ order_id: z.string().uuid() })), getOrderById)
```

Malformed or invalid IDs should fail at the routing layer, not inside services or DB queries.

### `lib/` inside a domain — Domain-specific helpers

- Mappers and query builders belong here
- **Only used by this domain** — if two domains need the same helper, move it to `src/utils/`
- Do not confuse with global `src/lib/` (third-party client inits); domain `lib/` has zero external dependencies

### Named sub-folders — Grouping related helpers

When a single concept spawns 3+ related files, create a named sub-folder with an `index.ts`:

```
summary-reports/
├── analytics/          # analytics pipeline: 3+ files, complex enough to isolate
├── export/             # report export engine
└── scheduling/         # async scheduling system
```

Valid reasons to create a sub-folder: async workflows, analytics pipelines, report generation,
scheduling systems, isolated subdomains, or when a file group becomes hard to navigate.

Do NOT create sub-folders for standard CRUD operations with 1–2 files each.

### `__tests__/` — Co-located with the domain

- Tests live next to the code they test, not in a separate top-level `tests/` folder
- `__fixtures__/make-fake-<domain>.ts` creates realistic fake data for tests

---

## Export Conventions

Prefer named exports everywhere:

```ts
// ✅ Preferred
export async function getOrderById(c: ...) {}
export const createOrder = async (c: ...) => {}

// ❌ Avoid
export default function getOrderById() {}
```

Named exports are:

- Safer to refactor (TypeScript finds all references)
- Better for IDE auto-imports (predictable symbol names)
- Easier to barrel-export from `index.ts`
- More explicit when reading import statements

---

## What Goes in Global Folders

Only code with **zero domain knowledge** belongs outside `modules/`:

| Folder        | Belongs Here                                        | Does NOT Belong Here      |
| ------------- | --------------------------------------------------- | ------------------------- |
| `middleware/` | Auth check, request logging, error handler          | Order-specific validation |
| `utils/`      | `paginate()`, `toISOString()`, custom Error classes | Any domain concept        |
| `lib/`        | Stripe client init, S3 client init                  | Payment business logic    |
| `constants/`  | HTTP status codes, env keys                         | Domain-specific enums     |
| `lib/db.ts`   | Prisma client init (`new PrismaClient()`)           | Any query                 |

If you find yourself importing a domain module into `utils/`, the code is in the wrong place.

---

## Decision Tree: Where Does New Code Go?

```
New code needed?
│
├─ Belongs to a specific domain? (user, order, product...)
│   │
│   ├─ HTTP handler (parse input, return response)?
│   │   └─ src/modules/<domain>/handlers/<domain>.handlers.ts
│   │       (split into multiple files only when size/complexity justifies it)
│   │
│   ├─ DB query?
│   │   └─ src/modules/<domain>/queries/<domain>.query.ts
│   │       (split when distinct subdomains emerge)
│   │
│   ├─ Multi-step business logic (multiple queries / cross-domain)?
│   │   └─ src/modules/<domain>/services/<domain>.service.ts
│   │
│   ├─ Zod schema / types for this domain?
│   │   └─ src/modules/<domain>/<domain>.schema.ts
│   │
│   ├─ Domain-specific helper (mapper, builder, formatter)?
│   │   └─ src/modules/<domain>/lib/<helper-name>.ts
│   │       (if 2+ domains need it → move to src/utils/)
│   │
│   ├─ Domain-specific concept with 3+ related files?
│   │   └─ src/modules/<domain>/<concept-name>/index.ts  (sub-folder + index)
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
- [ ] `<domain>.schema.ts` — Zod schema, types
- [ ] `queries/<domain>.query.ts` — grouped query functions
- [ ] `handlers/<domain>.handlers.ts` — grouped handler functions
- [ ] `<domain>.routes.ts` — chained factory route definitions with param validators
- [ ] `index.ts` — export routes
- [ ] Register routes in `src/modules/index.ts`
- [ ] `__tests__/__fixtures__/make-fake-<domain>.ts` — fake data factory
- [ ] `__tests__/` — add handler + query tests
- [ ] `services/<domain>.service.ts` — add only if orchestration is needed

---

## Implementation Details

For full code patterns and examples, read the rules files:

| Need                     | File                           |
| ------------------------ | ------------------------------ |
| Handler + route patterns | `rules/handlers-and-routes.md` |
| Query patterns (Prisma)  | `rules/queries.md`             |
| Service layer patterns   | `rules/services.md`            |
| Schema + type patterns   | `rules/schema.md`              |
| DB client + Prisma types | `rules/db-schema.md`           |
| Testing patterns         | `rules/testing.md`             |
