# Services

## When to Use

Create a service only when a handler needs:

- Multiple queries (e.g. validate stock → create order → send notification)
- Logic that spans more than one domain
- Business rules too complex to be an inline query call

If the operation is one query → call the query directly from the handler. No service needed.

---

## File Placement

```
src/modules/<domain>/services/
└── <domain>.service.ts       # ← all service functions for this domain in one file
```

Filename is `<domain>.service.ts`, not `<operation>-<domain>.service.ts`.
This is because a service is the abstraction layer of a domain, not of an individual operation.

---

## Pattern

Services are plain async functions. Throw `HTTPException` (from `hono/http-exception`) or
custom error classes — not raw `Error`. The global `.onError()` handler catches and formats them.

Dependencies are injected as function arguments with defaults, making services testable without
module-level mocking.

```typescript
// modules/order/services/order.service.ts
import { HTTPException } from 'hono/http-exception'
import { getProductById } from '@/modules/product/queries/product.query'
import { createOrder } from '../queries/order.query'
import { type Session } from '@/types/hono'

export type PlaceOrderPayload = {
  session: Session
  product_id: string
  quantity: number
}

export type PlaceOrderDeps = {
  getProductById: typeof getProductById
  createOrder: typeof createOrder
}

// วางคำสั่งซื้อ — orchestrate: ตรวจสต็อก → สร้าง order → คืน order
export async function placeOrder(
  payload: PlaceOrderPayload,
  deps: PlaceOrderDeps = { getProductById, createOrder }
) {
  const product = await deps.getProductById(payload.product_id)

  if (product.stock < payload.quantity) {
    throw new HTTPException(422, { message: 'สต็อกสินค้าไม่เพียงพอ' })
  }

  const order = await deps.createOrder({
    userId: payload.session.userId,
    productId: product.id,
    quantity: payload.quantity,
    totalAmount: product.price * payload.quantity,
    status: 'pending',
  })

  return order
}

export type PlaceOrderResponse = Awaited<ReturnType<typeof placeOrder>>
```

---

## Testing a Service

```typescript
// __tests__/order.service.test.ts
import { placeOrder } from '../services/order.service'
import { makeFakeProduct } from '@/modules/product/__tests__/__fixtures__/make-fake-product'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockDeps = {
  getProductById: vi.fn(),
  createOrder: vi.fn(),
}

describe('placeOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should create an order when stock is sufficient', async () => {
    const fakeProduct = makeFakeProduct({ stock: 10, price: 100 })
    mockDeps.getProductById.mockResolvedValue(fakeProduct)
    mockDeps.createOrder.mockResolvedValue({ id: 'order-1', totalAmount: 200 })

    const result = await placeOrder(
      { session: { userId: 'user-1' }, product_id: fakeProduct.id, quantity: 2 },
      mockDeps
    )

    expect(result.totalAmount).toBe(200)
    expect(mockDeps.createOrder).toHaveBeenCalledOnce()
  })

  it('should throw 422 when stock is insufficient', async () => {
    const fakeProduct = makeFakeProduct({ stock: 1 })
    mockDeps.getProductById.mockResolvedValue(fakeProduct)

    await expect(
      placeOrder(
        { session: { userId: 'user-1' }, product_id: fakeProduct.id, quantity: 5 },
        mockDeps
      )
    ).rejects.toMatchObject({ status: 422 })

    expect(mockDeps.createOrder).not.toHaveBeenCalled()
  })
})
```

---

## Rules

- Inject all external dependencies as function args with real defaults — makes testing trivial
- Throw `HTTPException` or custom error classes, not raw `Error`
- Always export a `Response` type: `export type <Operation>Response = Awaited<ReturnType<typeof ...>>`
- Services can call queries from other domains — that's the point. But they must not import handlers
- Services orchestrate; queries own Prisma access; handlers own HTTP
