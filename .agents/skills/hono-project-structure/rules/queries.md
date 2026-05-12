# Queries

## Responsibility

Queries เป็น pure DB operations ผ่าน Prisma:

- ไม่มี HTTP context (`req`, `res`, `c`)
- ไม่มี business rules
- หนึ่งไฟล์ = หนึ่ง operation

---

## File Placement

```
src/modules/<domain>/queries/
├── create-<domain>.query.ts
├── get-<domain>.query.ts
├── update-<domain>.query.ts
├── delete-<domain>.query.ts
└── search-<domain>s.query.ts
```

---

## Patterns

### Create

```typescript
// queries/create-order.query.ts
import { db } from '@/lib/db'
import { type CreateOrder } from '../order.schema'

export type CreateOrderQueryArgs = {
  values: CreateOrder
}

export async function createOrderQuery({ values }: CreateOrderQueryArgs) {
  const order = await db.order.create({
    data: values,
    include: {
      user: true,
      items: {
        include: { product: true },
      },
    },
  })

  return order
}

export type CreateOrderQueryResponse = Awaited<ReturnType<typeof createOrderQuery>>
```

### Create inside transaction

เมื่อ service ส่ง `tx` มา ให้รับเป็น optional arg แล้ว fallback เป็น `db`:

```typescript
// queries/create-order.query.ts
import { db } from '@/lib/db'
import { type Prisma } from '@workspace/database'
import { type CreateOrder } from '../order.schema'

export type CreateOrderQueryArgs = {
  values: CreateOrder
  tx?: Prisma.TransactionClient
}

export async function createOrderQuery({ values, tx }: CreateOrderQueryArgs) {
  const client = tx ?? db

  const order = await client.order.create({
    data: values,
    include: { user: true, items: true },
  })

  return order
}

export type CreateOrderQueryResponse = Awaited<ReturnType<typeof createOrderQuery>>
```

### Get single

```typescript
// queries/get-order.query.ts
import { db } from '@/lib/db'
import { NotFoundError } from '@/utils/errors'

export type GetOrderQueryArgs = {
  id: string
}

export async function getOrderQuery({ id }: GetOrderQueryArgs) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: { product: true },
      },
    },
  })

  if (!order) throw new NotFoundError('ไม่พบข้อมูล order ที่ต้องการ')

  return order
}

export type GetOrderQueryResponse = Awaited<ReturnType<typeof getOrderQuery>>
```

### Update

```typescript
// queries/update-order.query.ts
import { db } from '@/lib/db'
import { type UpdateOrder } from '../order.schema'
import { NotFoundError } from '@/utils/errors'

export type UpdateOrderQueryArgs = {
  id: string
  values: UpdateOrder
}

export async function updateOrderQuery({ id, values }: UpdateOrderQueryArgs) {
  const existing = await db.order.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('ไม่พบข้อมูล order ที่ต้องการ')

  const order = await db.order.update({
    where: { id },
    data: values,
    include: { user: true, items: true },
  })

  return order
}

export type UpdateOrderQueryResponse = Awaited<ReturnType<typeof updateOrderQuery>>
```

### Delete

```typescript
// queries/delete-order.query.ts
import { db } from '@/lib/db'
import { NotFoundError } from '@/utils/errors'

export type DeleteOrderQueryArgs = {
  id: string
}

export async function deleteOrderQuery({ id }: DeleteOrderQueryArgs) {
  const existing = await db.order.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('ไม่พบข้อมูล order ที่ต้องการ')

  const order = await db.order.delete({ where: { id } })

  return order
}

export type DeleteOrderQueryResponse = Awaited<ReturnType<typeof deleteOrderQuery>>
```

### Search with filters + pagination

```typescript
// queries/search-orders.query.ts
import { db } from '@/lib/db'
import { type Prisma } from '@workspace/database'

export type SearchOrdersFilters = {
  q?: string
  status?: string
  userId?: string
  includeArchived?: boolean
}

export type SearchOrdersQueryArgs = {
  page?: number
  limit?: number
  sortBy?: string
  orderBy?: 'asc' | 'desc'
  filters?: SearchOrdersFilters
}

export async function searchOrdersQuery({
  page = 1,
  limit = 25,
  sortBy = 'createdAt',
  orderBy = 'desc',
  filters,
}: SearchOrdersQueryArgs) {
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

export type SearchOrdersQueryResponse = Awaited<ReturnType<typeof searchOrdersQuery>>
```

---

## Rules

- Import `db` จาก `@/lib/db` เสมอ
- Prisma ไม่ throw เองเมื่อหาไม่เจอ — ต้อง `findUnique` แล้วตรวจ `null` แล้ว throw `NotFoundError` เอง
- Transaction: รับ `tx?: Prisma.TransactionClient` เป็น optional แล้ว `const client = tx ?? db`
- Always export `Response` type: `export type <Operation><Domain>QueryResponse = Awaited<ReturnType<typeof ...>>`
- ไม่ import จาก `handlers/` หรือใช้ `HonoEnv`
