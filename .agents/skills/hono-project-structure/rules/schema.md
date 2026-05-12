# Schema

## Responsibility

`<domain>.schema.ts` is the single source of truth for a domain's types:

- Zod schema for validation
- OpenAPI registration for docs
- Derived TypeScript types for handlers and queries

---

## File Placement

```
src/modules/<domain>/<domain>.schema.ts
```

---

## Pattern

```typescript
// modules/order/order.schema.ts
import { z } from '@hono/zod-openapi'
import { type Order } from '@/db/schema'

// --- Zod schema (matches DB type) ---
export const orderSchemaObject = {
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'cancelled']),
  total_amount: z.number(),
  created_at: z.union([z.coerce.date(), z.string()]).openapi({
    example: new Date().toISOString(),
  }),
  updated_at: z.union([z.coerce.date(), z.string()]).openapi({
    example: new Date().toISOString(),
  }),
  deleted_at: z.union([z.coerce.date(), z.string()]).nullable().openapi({
    example: null,
  }),
}

export const orderSchema = z.object(orderSchemaObject) satisfies z.ZodType<Order>

// --- OpenAPI registration ---
export const orderSchemaOpenApi = orderSchema.openapi('Order')

// --- Derived types ---
export type CreateOrder = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
export type UpdateOrder = Partial<Omit<Order, 'id' | 'created_at'>>
```

---

## Rules

- `satisfies z.ZodType<Entity>` — ensures the schema stays in sync with the DB type; TypeScript will error if they drift
- OpenAPI registration goes here, not in handlers
- Export `Create<Domain>` and `Update<Domain>` types for use in queries
- Do not import anything from `handlers/` or `queries/` — this file has no dependencies within the domain
