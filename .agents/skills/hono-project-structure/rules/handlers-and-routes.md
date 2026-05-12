# Handlers & Routes

## Responsibility

Handlers deal with HTTP only:

- Parse validated input from request
- Call query (simple) or service (complex)
- Return JSON with correct status code

No business logic. No raw DB calls. No `if/else` about domain rules.

---

## File Placement

```
src/modules/<domain>/
├── <domain>.routes.ts          # registers all handlers for this domain
└── handlers/
    ├── create-<domain>.ts
    ├── get-<domain>.ts
    ├── get-<domain>s.ts
    ├── update-<domain>.ts
    ├── delete-<domain>.ts
    └── search-<domain>s.ts
```

---

## Schema & Types (defined inside each handler file)

Each handler file owns its request/response schema:

```typescript
// handlers/create-order.ts
import { createRoute, z } from '@hono/zod-openapi'
import { orderSchemaOpenApi } from '../order.schema'
import { type AppRouteHandler } from '@/types/hono'
import { createOrderQuery } from '../queries/create-order.query'

// --- Schemas ---
const createOrderBodySchema = z.object({
  user_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
})

// --- Route definition ---
export const createOrderRoute = createRoute({
  method: 'post',
  path: '/orders',
  tags: ['Orders'],
  summary: 'Create an order',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: createOrderBodySchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: orderSchemaOpenApi } },
      description: 'Order created',
    },
  },
})

// --- Handler ---
export const createOrderHandler: AppRouteHandler<typeof createOrderRoute> = async c => {
  const dbClient = c.get('dbClient')
  const body = c.req.valid('json')

  const order = await createOrderQuery({ dbClient, values: body })

  return c.json(order, { status: 201 })
}
```

---

## Route Registration

All handlers for a domain register in `<domain>.routes.ts`:

```typescript
// order.routes.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { type HonoEnv } from '@/types/hono'
import { createOrderRoute, createOrderHandler } from './handlers/create-order'
import { getOrderRoute, getOrderHandler } from './handlers/get-order'
import { getOrdersRoute, getOrdersHandler } from './handlers/get-orders'
import { updateOrderRoute, updateOrderHandler } from './handlers/update-order'
import { deleteOrderRoute, deleteOrderHandler } from './handlers/delete-order'

export const orderRoutes = new OpenAPIHono<HonoEnv>()
  .openapi(createOrderRoute, createOrderHandler)
  .openapi(getOrderRoute, getOrderHandler)
  .openapi(getOrdersRoute, getOrdersHandler)
  .openapi(updateOrderRoute, updateOrderHandler)
  .openapi(deleteOrderRoute, deleteOrderHandler)
```

Then export from `modules/index.ts`:

```typescript
// modules/index.ts
import { type HonoEnv } from '@/types/hono'
import { OpenAPIHono } from '@hono/zod-openapi'
import { orderRoutes } from './order'
import { userRoutes } from './user'

export function mountRoutes(app: OpenAPIHono<HonoEnv>) {
  app.route('/orders', orderRoutes)
  app.route('/users', userRoutes)
}
```

---

## Common Handler Patterns

### Get single resource

```typescript
export const getOrderHandler: AppRouteHandler<typeof getOrderRoute> = async c => {
  const dbClient = c.get('dbClient')
  const { order_id } = c.req.valid('param')

  const order = await getOrderQuery({ dbClient, id: order_id })

  return c.json(order, { status: 200 })
}
```

### Get list with pagination

```typescript
export const getOrdersHandler: AppRouteHandler<typeof getOrdersRoute> = async c => {
  const dbClient = c.get('dbClient')
  const { limit, page, sort_by, order_by } = c.req.valid('query')

  const result = await searchOrdersQuery({
    dbClient,
    limit: Number(limit) || 25,
    page: Number(page) || 1,
    sortBy: sort_by,
    orderBy: order_by,
  })

  return c.json(result, { status: 200 })
}
```

### Archive (soft delete)

```typescript
export const archiveOrderHandler: AppRouteHandler<typeof archiveOrderRoute> = async c => {
  const dbClient = c.get('dbClient')
  const { order_id } = c.req.valid('param')

  const order = await updateOrderQuery({
    dbClient,
    id: order_id,
    values: { deleted_at: new Date() },
  })

  return c.json(order, { status: 200 })
}
```

### When business logic is needed — call service instead

```typescript
export const placeOrderHandler: AppRouteHandler<typeof placeOrderRoute> = async c => {
  const dbClient = c.get('dbClient')
  const body = c.req.valid('json')
  const session = c.get('session')

  // Complex logic → delegate to service
  const order = await placeOrderService({ dbClient, payload: { ...body, session } })

  return c.json(order, { status: 201 })
}
```

---

## Error Handling

Do not catch errors in handlers. Let them bubble up to the global error middleware.
Use `NotFoundError` and other custom error classes from `@/utils/errors` inside queries/services — the global handler will format the response.
