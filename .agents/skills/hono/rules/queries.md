# Queries

## Responsibility

Queries are pure DB operations via Prisma:

- No HTTP context (`req`, `res`, `c`)
- No business rules
- Use `select` or `include` only when necessary — don't over-fetch

---

## File Placement

```
src/modules/<domain>/queries/
└── <domain>.query.ts       # ← all query functions for this domain in one file
```

All operations in a domain go in one file by default.
Split files only when the file becomes too large to navigate or when there are clear subdomains.

---

## Grouped Query File

```typescript
// queries/order.query.ts
import { db } from '@/lib/db'
import { NotFoundError } from '@/utils/errors'
import { type CreateOrder, type UpdateOrder } from '../order.schema'
import { type Prisma } from '@workspace/database'

// --- Get single ---
export async function getOrderById(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: { include: { product: true } },
    },
  })

  if (!order) throw new NotFoundError('ไม่พบข้อมูล order ที่ต้องการ')

  return order
}

export type GetOrderByIdResponse = Awaited<ReturnType<typeof getOrderById>>

// --- Create ---
export async function createOrder(values: CreateOrder, tx?: Prisma.TransactionClient) {
  const client = tx ?? db

  return client.order.create({
    data: values,
    include: { user: true, items: true },
  })
}

export type CreateOrderResponse = Awaited<ReturnType<typeof createOrder>>

// --- Update ---
export async function updateOrder(
  id: string,
  values: UpdateOrder,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? db

  const existing = await client.order.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('ไม่พบข้อมูล order ที่ต้องการ')

  return client.order.update({
    where: { id },
    data: values,
    include: { user: true, items: true },
  })
}

export type UpdateOrderResponse = Awaited<ReturnType<typeof updateOrder>>

// --- Delete ---
export async function deleteOrder(id: string) {
  const existing = await db.order.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('ไม่พบข้อมูล order ที่ต้องการ')

  return db.order.delete({ where: { id } })
}

export type DeleteOrderResponse = Awaited<ReturnType<typeof deleteOrder>>

// --- Search with filters + pagination ---
export type SearchOrdersFilters = {
  q?: string
  status?: string
  userId?: string
  includeArchived?: boolean
}

export type SearchOrdersArgs = {
  page?: number
  limit?: number
  sortBy?: string
  orderBy?: 'asc' | 'desc'
  filters?: SearchOrdersFilters
}

export async function searchOrders({
  page = 1,
  limit = 25,
  sortBy = 'createdAt',
  orderBy = 'desc',
  filters,
}: SearchOrdersArgs) {
  const where: Prisma.OrderWhereInput = {
    ...(filters?.includeArchived ? {} : { deletedAt: null }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.userId && { userId: filters.userId }),
    ...(filters?.q && {
      OR: [{ id: { contains: filters.q, mode: 'insensitive' } }],
    }),
  }

  const [records, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { user: true, items: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: orderBy },
    }),
    db.order.count({ where }),
  ])

  return {
    records,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export type SearchOrdersResponse = Awaited<ReturnType<typeof searchOrders>>
```

---

## Rules

- Always import `db` from `@/lib/db`
- Prisma does not throw on not found — use `findUnique`, check for `null`, and throw `NotFoundError` yourself
- Transaction: accept `tx?: Prisma.TransactionClient` as optional and use `const client = tx ?? db`
- Always export a `Response` type: `export type <Operation>Response = Awaited<ReturnType<typeof ...>>`
- Do not import from `handlers/` or use `HonoEnv`
- Use `select` only when necessary — do not over-include relations by default
