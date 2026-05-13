# Schema

## Responsibility

`<domain>.schema.ts` is the single source of truth for a domain's types:

- Zod schema for request/response validation
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
import { z } from 'zod'
import { type Order } from '@workspace/database'

// --- Entity schema (matches DB type) ---
export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'cancelled']),
  totalAmount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
}) satisfies z.ZodType<Order>

// --- Request input schemas ---
export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'cancelled']).optional(),
  quantity: z.number().int().positive().optional(),
})

// --- Derived types ---
export type CreateOrder = z.infer<typeof createOrderSchema>
export type UpdateOrder = z.infer<typeof updateOrderSchema>
export type Order = z.infer<typeof orderSchema>
```

---

## Rules

- `satisfies z.ZodType<Entity>` — ensures the schema stays in sync with the DB type; TypeScript will error if they drift
- Export `Create<Domain>` and `Update<Domain>` types for use in queries and handlers
- Do not import anything from `handlers/` or `queries/` — this file has zero inward dependencies
- Keep entity schema and request schemas in the same file; split only if the file becomes very large
