# Handlers & Routes

## Responsibility

Handlers deal with HTTP only:

- Parse validated input from request (`c.req.valid(...)`)
- Call query (simple) or service (complex)
- Return `c.json()` with correct status code

No business logic. No raw Prisma calls. No try-catch. No domain rules.
Let errors bubble to the global `.onError()` handler — services and queries throw,
the global handler formats the response.

---

## File Placement

```
src/modules/<domain>/
├── <domain>.routes.ts            # chained factory route definitions
└── handlers/
    └── <domain>.handlers.ts      # all handler functions for this domain
```

All handlers for a domain live in one file by default.
Only split when a file genuinely becomes hard to navigate (signal: > ~200 lines of logic
or the domain has distinct sub-areas like `order-fulfillment` vs `order-returns`).

---

## Grouped Handler File

```ts
// handlers/order.handlers.ts
import { db } from '@/lib/db'
import { type JsonContext, type JsonWithParamContext } from '@/types/hono'
import { type CreateOrder, type UpdateOrder } from '../order.schema'
import { getOrderById as getOrderByIdQuery } from '../queries/order.query'
import { createOrder as createOrderQuery } from '../queries/order.query'
import { deleteOrder as deleteOrderQuery } from '../queries/order.query'
import { placeOrderService } from '../services/order.service'

// --- Get single ---
export async function getOrderById(c: JsonWithParamContext<never, { order_id: string }>) {
  const { order_id } = c.req.valid('param')
  const order = await getOrderByIdQuery(order_id)
  return c.json(order, 200)
}

// --- Create (simple: one query, no service needed) ---
export async function createOrder(c: JsonContext<CreateOrder>) {
  const body = c.req.valid('json')
  const order = await createOrderQuery(body)
  return c.json(order, 201)
}

// --- Create (complex: delegates to service) ---
export async function placeOrder(c: JsonContext<CreateOrder>) {
  const body = c.req.valid('json')
  const session = c.get('session')
  const order = await placeOrderService({ payload: { ...body, session } })
  return c.json(order, 201)
}

// --- Update ---
export async function updateOrder(c: JsonWithParamContext<UpdateOrder, { order_id: string }>) {
  const { order_id } = c.req.valid('param')
  const body = c.req.valid('json')
  const order = await updateOrderQuery({ id: order_id, values: body })
  return c.json(order, 200)
}

// --- Delete ---
export async function deleteOrder(c: JsonWithParamContext<never, { order_id: string }>) {
  const { order_id } = c.req.valid('param')
  await deleteOrderQuery(order_id)
  return c.json({ success: true }, 200)
}
```

---

## Context Type Helpers

Always import from `@/types/hono`. Prefer specific helpers over the generic `Context<HonoEnv>`:

| Helper                       | Use when...                                    |
| ---------------------------- | ---------------------------------------------- |
| `JsonContext<T>`             | Handler has a validated JSON body              |
| `JsonWithParamContext<T, P>` | Handler has both JSON body and path params     |
| `QueryContext<T>`            | Handler has validated query params             |
| `Context<HonoEnv>`           | Handler has no validated input (e.g. GET list) |

```ts
import { type JsonContext, type JsonWithParamContext, type QueryContext } from '@/types/hono'
```

---

## Route Registration (Project Rules)

For `factory`, `zValidator`, and route chaining syntax → see the **Project-Specific Hono Rules** section above, or use context7 to query Hono docs.

Project-specific rules:

- Use `factory.createApp()` from `@/types/hono` — never `new Hono<HonoEnv>()` directly
- Routes in `<domain>.routes.ts` must be a **single chained expression** — broken chains lose `AppType` inference
- Always place `zValidator('param', ...)` before handlers on routes with path params
- Export `AppType` from `modules/index.ts` for the frontend RPC client

---

## Path Param Validation

Validate path params with `zValidator('param', ...)` at the router level, before the handler.
Malformed IDs should fail at the router — they must not reach services or DB queries.
(For `zValidator` syntax → use context7 to query Hono docs.)

---

## Error Handling

Do not try-catch in handlers. Let errors bubble to the global `.onError()` handler.
Services and queries throw `HTTPException` or custom error classes — the global handler formats the response.
(For `onError` syntax → use context7 to query Hono docs.)
