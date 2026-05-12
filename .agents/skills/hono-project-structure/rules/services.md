# Services

## When to Use

Create a service only when a handler needs:

- Multiple queries (e.g. validate stock → create order → send notification)
- Logic that spans more than one domain
- Business rules that would clutter the handler

If the operation is one query → call the query directly from the handler. No service needed.

---

## File Placement

```
src/modules/<domain>/services/
└── <operation>-<domain>.service.ts
```

---

## Pattern

Dependencies are injected as function arguments with defaults. This makes services testable without mocking modules.

```typescript
// modules/order/services/place-order.service.ts
import { type DbClient } from '@/db/create-db-client'
import { type Session } from '@/types/hono'
import { getProductQuery } from '@/modules/product/queries/get-product.query'
import { createOrderQuery } from '../queries/create-order.query'
import { NotFoundError } from '@/utils/errors'

export type PlaceOrderServiceDependencies = {
  getProductQuery: typeof getProductQuery
  createOrderQuery: typeof createOrderQuery
}

export type PlaceOrderServiceArgs = {
  dbClient: DbClient
  payload: {
    session: Session
    product_id: string
    quantity: number
  }
  dependencies?: PlaceOrderServiceDependencies
}

export async function placeOrderService({
  dbClient,
  payload,
  dependencies = {
    getProductQuery,
    createOrderQuery,
  },
}: PlaceOrderServiceArgs) {
  const product = await dependencies.getProductQuery({
    dbClient,
    id: payload.product_id,
  })

  if (product.stock < payload.quantity) {
    throw new Error('Insufficient stock.')
  }

  const order = await dependencies.createOrderQuery({
    dbClient,
    values: {
      user_id: payload.session.accountId,
      product_id: product.id,
      quantity: payload.quantity,
      total_amount: product.price * payload.quantity,
      status: 'pending',
    },
  })

  return order
}

export type PlaceOrderServiceResponse = Awaited<ReturnType<typeof placeOrderService>>
```

---

## Testing a Service

```typescript
// __tests__/order.service.test.ts
import { placeOrderService } from '../services/place-order.service'
import { makeFakeProduct } from '@/modules/product/__tests__/__fixtures__/make-fake-product'
import { mockDbClient } from '@/db/__test-utils__/mock-db-client'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { dbClient } = mockDbClient

const mockDependencies = {
  getProductQuery: vi.fn(),
  createOrderQuery: vi.fn(),
}

describe('placeOrderService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should create an order when stock is sufficient', async () => {
    const fakeProduct = makeFakeProduct({ stock: 10, price: 100 })
    mockDependencies.getProductQuery.mockResolvedValue(fakeProduct)
    mockDependencies.createOrderQuery.mockResolvedValue({ id: 'order-1', total_amount: 200 })

    const result = await placeOrderService({
      dbClient,
      payload: { session: { accountId: 'user-1' }, product_id: fakeProduct.id, quantity: 2 },
      dependencies: mockDependencies,
    })

    expect(result.total_amount).toBe(200)
    expect(mockDependencies.createOrderQuery).toHaveBeenCalledOnce()
  })

  it('should throw when stock is insufficient', async () => {
    const fakeProduct = makeFakeProduct({ stock: 1 })
    mockDependencies.getProductQuery.mockResolvedValue(fakeProduct)

    await expect(
      placeOrderService({
        dbClient,
        payload: { session: { accountId: 'user-1' }, product_id: fakeProduct.id, quantity: 5 },
        dependencies: mockDependencies,
      })
    ).rejects.toThrow('Insufficient stock.')

    expect(mockDependencies.createOrderQuery).not.toHaveBeenCalled()
  })
})
```

---

## Rules

- Inject all external dependencies — never import queries directly and call them without injection
- Always export a `Response` type: `export type <Operation><Domain>ServiceResponse = Awaited<ReturnType<typeof ...>>`
- Services can import queries from other domains — that's the point. But they should not import handlers from other domains
