---
name: hono
description: Use when building, modifying, or reviewing any Hono API endpoint — covers both project file structure AND Hono-specific patterns for this project. TRIGGER on any of: new endpoint, new domain, refactoring handlers/queries/services, code review, route registration, middleware setup, or any question about where files belong in the backend. Also trigger when code imports from 'hono' or 'hono/*', or user mentions Hono routing, validation, RPC chaining, middleware, streaming, or testing. Use `npx hono request` to test endpoints.
---

# Hono Backend

This skill covers **project-specific structure and patterns** for this Hono + Prisma backend.

## Source of Truth

| Source       | Owns                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| `rules/*.md` | **What to do and why** — architecture decisions, layer responsibilities, project patterns |
| **context7** | **How to write it** — Hono API syntax, function signatures, import paths                  |

- `rules/*.md` is the source of truth of project — if rules/ says pattern should be how, follow rules/ first
- context7 is for verify syntax only — do not use to decide whether project architecture is correct or not
- code examples in `rules/` show **pattern** not exact syntax — if you want the exact function signature, query context7

---

## Hono CLI — Testing Endpoints

```bash
# GET — no HTTP server needed
npx hono request [file] -P /path

# POST with JSON body
npx hono request [file] -X POST -P /api/users -d '{"name": "test"}'
```

> Node.js projects with bindings → use `workers-fetch` instead.

---

## Project Layout

```
src/
├── app.ts                  # Bootstrap: init Hono app, register global middleware, mount routes
├── server.ts               # Node.js entry point
├── env.ts                  # Zod-validated environment variables
│
├── modules/                # ← Domain modules (core of the app)
│   ├── index.ts            # Mount all module routes + export AppType
│   └── <domain>/
│       ├── index.ts                        # Export routes for this domain
│       ├── <domain>.schema.ts              # Zod schema + derived types
│       ├── <domain>.routes.ts              # Chained factory route definitions
│       ├── handlers/
│       │   └── <domain>.handlers.ts        # All HTTP handlers in one file
│       ├── queries/
│       │   └── <domain>.query.ts           # All DB queries in one file
│       ├── services/                       # Only when orchestration is needed
│       │   └── <domain>.service.ts
│       ├── lib/                            # Domain-specific helpers (mappers, builders)
│       └── __tests__/
│           ├── <domain>.handlers.test.ts
│           ├── <domain>.queries.test.ts
│           └── __fixtures__/
│               └── make-fake-<domain>.ts
│
├── lib/db.ts               # Prisma client — export `db` ให้ทุก query ใช้
├── middleware/             # Global middleware (auth, logging, error handling)
├── lib/                    # Third-party integrations (e.g. better-auth, storage)
├── types/
│   └── hono.ts             # HonoEnv, JsonContext, JsonWithParamContext, QueryContext
├── constants/              # App-wide constants
└── utils/                  # Pure stateless helpers (errors, pagination, etc.)
```

---

## Naming Conventions

| Context                                  | Convention   | Example                          |
| ---------------------------------------- | ------------ | -------------------------------- |
| Folders & files                          | `kebab-case` | `summary-reports.handlers.ts`    |
| Classes & Types                          | `PascalCase` | `CreateOrderBody`, `OrderSchema` |
| Functions, Zod schemas                   | `camelCase`  | `createOrder`, `orderSchema`     |
| DB tables, columns, request/query params | `snake_case` | `user_id`, `created_at`          |

File naming within a domain:

- `<domain>.handlers.ts` — plural: a **collection** of handler functions
- `<domain>.service.ts` — singular: the business logic **module**
- `<domain>.query.ts` — singular: the data access **module**
- `<domain>.schema.ts` — singular: single source of truth for types and validation

---

## Decision Tree: Where Does New Code Go?

```
New code needed?
│
├─ Belongs to a specific domain? (user, order, product...)
│   ├─ HTTP handler → src/modules/<domain>/handlers/<domain>.handlers.ts
│   ├─ DB query → src/modules/<domain>/queries/<domain>.query.ts
│   ├─ Multi-step logic (multiple queries / cross-domain) → src/modules/<domain>/services/<domain>.service.ts
│   ├─ Zod schema / types → src/modules/<domain>/<domain>.schema.ts
│   ├─ Domain-specific helper (mapper, builder) → src/modules/<domain>/lib/<helper-name>.ts
│   │   (if 2+ domains need it → move to src/utils/)
│   ├─ Domain concept with 3+ related files → src/modules/<domain>/<concept-name>/index.ts
│   └─ Test or fake data → src/modules/<domain>/__tests__/
│
└─ No domain (truly shared)?
    ├─ Global middleware → src/middleware/
    ├─ Pure helper fn → src/utils/
    ├─ 3rd party client → src/lib/
    └─ App-wide constant → src/constants/
```

---

## Responsibility of Each Layer

### handlers/ — HTTP only

- Parse validated input: `c.req.valid(...)`
- Call **query** (simple) or **service** (complex)
- Return `c.json()` with the correct status code
- **No business logic. No raw Prisma calls. No try-catch.**
- Let errors bubble to the global `.onError()` handler
- Use `JsonContext<T>`, `JsonWithParamContext<T, P>`, `QueryContext<T>` from `@/types/hono`

### queries/ — DB only

- Pure Prisma queries — no HTTP context (`c`, `req`, `res`)
- Prisma does not throw on not-found → check `null` after `findUnique`, throw `NotFoundError` yourself
- Use precise `select` / `include` — avoid over-fetching
- Export a `Response` type: `export type GetOrderResponse = Awaited<ReturnType<typeof getOrder>>`

### services/ — Orchestration only

- Use **only** when a handler needs multiple queries or cross-domain logic
- If the operation is a single query → call the query directly from the handler; skip the service layer
- Throw `HTTPException` or custom error classes — not raw `Error`

### `<domain>.schema.ts` — Single source of truth

- Zod schemas for request validation
- Derived TypeScript types: `Create<Domain>`, `Update<Domain>`, `<Domain>Response`

---

## The Grouped-File Default

Files are **navigation units**, not operation units.

All handlers for a domain belong in **one file** by default. All queries belong in **one file** by default.

```ts
// handlers/order.handlers.ts — one file, all operations
export async function getOrderById(c: ...) {}
export async function createOrder(c: ...) {}
export async function updateOrder(c: ...) {}
export async function deleteOrder(c: ...) {}
```

Split into multiple files **only when**:

- File exceeds ~200 lines of actual logic
- There are distinct subdomains (e.g. `order-fulfillment.handlers.ts` vs `order-returns.handlers.ts`)

---

## Project-Specific Hono Rules

### Factory Pattern — Always use this

```ts
// ❌ Never
const app = new Hono<HonoEnv>()

// ✅ Always
const factory = createFactory<HonoEnv>()
const app = factory.createApp()
const mw = factory.createMiddleware(async (c, next) => { await next() })
```

`createFactory` from `@/types/hono` ensures `HonoEnv` is shared across the app, middleware, and handlers without re-typing generics.

### RPC Chaining — Must be a single chained expression

```ts
// ✅ Correct — type inference works
const route = app
  .get('/posts', listPosts)
  .post('/posts', zValidator('json', createPostSchema), createPost)

export type AppType = typeof route
```

Broken chains lose `AppType` inference. Export `AppType` from `modules/index.ts` for the frontend RPC client.

### Path Param Validation — At the router boundary

```ts
.get('/:order_id',
  zValidator('param', z.object({ order_id: z.string().uuid() })),
  getOrderById
)
```

Malformed IDs must fail at the router — they must not reach services or DB queries.

### Node.js Adapter

```ts
import { serve } from '@hono/node-server'
serve(app)
```

### Named Exports Only

```ts
// ✅ Preferred
export async function getOrderById(c: ...) {}

// ❌ Avoid
export default function getOrderById() {}
```

Named exports are safer to refactor, better for IDE auto-imports, and easier to barrel-export.

---

## What Goes in Global Folders

| Folder        | Belongs Here                                        | Does NOT Belong Here      |
| ------------- | --------------------------------------------------- | ------------------------- |
| `middleware/` | Auth check, request logging, error handler          | Order-specific validation |
| `utils/`      | `paginate()`, `toISOString()`, custom Error classes | Any domain concept        |
| `lib/`        | Stripe client init, S3 client init                  | Payment business logic    |
| `constants/`  | HTTP status codes, env keys                         | Domain-specific enums     |
| `lib/db.ts`   | Prisma client init (`new PrismaClient()`)           | Any query                 |

> If you find yourself importing a domain module into `utils/`, the code is in the wrong place.

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

## Implementation Details — Read Before Writing Code

When the task involves a specific layer, read the corresponding file **before writing any code**:

| Need                     | File                           |
| ------------------------ | ------------------------------ |
| Handler + route patterns | `rules/handlers-and-routes.md` |
| Query patterns (Prisma)  | `rules/queries.md`             |
| Service layer patterns   | `rules/services.md`            |
| Schema + type patterns   | `rules/schema.md`              |
| DB client + Prisma types | `rules/db-schema.md`           |
| Testing patterns         | `rules/testing.md`             |
