# DB Schema

## Responsibility

Prisma generate types จาก `schema.prisma` อัตโนมัติ ใช้ได้เลยไม่ต้อง override
`src/lib/db.ts` เป็นที่ init `PrismaClient` และ export `db` ให้ทุก query ใช้

---

## db client

```typescript
// src/lib/db.ts
import { PrismaClient } from '@workspace/database'

export const db = new PrismaClient()
```

Import ใช้งาน:

```typescript
import { db } from '@/lib/db'
```

---

## Adding a New Model

1. เพิ่ม model ใน `prisma/schema.prisma`
2. รัน `pnpm prisma migrate dev --name <migration-name>`
3. Prisma generate types ให้อัตโนมัติ — ใช้ได้เลยใน query files

```prisma
model Order {
  id        String   @id @default(uuid())
  status    String   @default("pending")
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]
}
```

---

## Using Prisma Types in Queries

ใช้ `Prisma.ModelWhereInput` และ type อื่น ๆ จาก Prisma โดยตรง:

```typescript
import { type Prisma } from '@workspace/database'

const where: Prisma.OrderWhereInput = {
  deletedAt: null,
  status: 'pending',
}

// Transaction client
async function someQuery({ tx }: { tx?: Prisma.TransactionClient }) {
  const client = tx ?? db
  // ...
}
```

---

## Soft Delete Convention

ใช้ `deletedAt DateTime?` ใน schema — ไม่ลบจริง แต่ set วันที่:

```typescript
// archive
await db.order.update({
  where: { id },
  data: { deletedAt: new Date() },
})

// unarchive
await db.order.update({
  where: { id },
  data: { deletedAt: null },
})

// query เฉพาะ active records
const where: Prisma.OrderWhereInput = { deletedAt: null }
```
