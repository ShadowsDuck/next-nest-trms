# Testing

## Where Tests Live

Tests live inside the domain, not in a top-level `tests/` folder:

```
src/modules/<domain>/__tests__/
├── <domain>.handlers.test.ts   # integration: full HTTP request → response
├── <domain>.queries.test.ts    # unit: DB query in isolated transaction
└── __fixtures__/
    └── make-fake-<domain>.ts   # fake data factory
```

---

## Fake Data Factory

```typescript
// __tests__/__fixtures__/make-fake-order.ts
import { type Order } from '../../order.schema'
import { faker } from '@faker-js/faker'

export function makeFakeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    status: 'pending',
    total_amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    created_at: faker.date.recent(),
    updated_at: faker.date.recent(),
    deleted_at: null,
    ...overrides,
  }
}
```

---

## Query Tests (DB — transaction rollback)

Query tests run inside a transaction that rolls back after each test. No cleanup needed.

```typescript
// __tests__/order.queries.test.ts
import { createOrderQuery } from '../queries/create-order.query'
import { getOrderQuery } from '../queries/get-order.query'
import { makeFakeOrder } from './__fixtures__/make-fake-order'
import { testWithDbClient } from '@/db/__test-utils__/test-with-db-client'
import { NotFoundError } from '@/utils/errors'

describe('createOrderQuery', () => {
  testWithDbClient('should insert and return the order', async ({ dbClient }) => {
    const fake = makeFakeOrder()

    const created = await createOrderQuery({ dbClient, values: fake })

    expect(created.id).toBeDefined()
    expect(created.status).toBe('pending')
    expect(created.user_id).toBe(fake.user_id)
  })
})

describe('getOrderQuery', () => {
  testWithDbClient('should return the order by id', async ({ dbClient }) => {
    const fake = makeFakeOrder()
    await createOrderQuery({ dbClient, values: fake })

    const order = await getOrderQuery({ dbClient, id: fake.id })

    expect(order.id).toBe(fake.id)
  })

  testWithDbClient('should throw NotFoundError for unknown id', async ({ dbClient }) => {
    await expect(
      getOrderQuery({ dbClient, id: faker.string.uuid() })
    ).rejects.toThrow(NotFoundError)
  })
})
```

---

## Handler Tests (HTTP — full integration)

Handler tests call the actual Hono app and assert the HTTP response.

```typescript
// __tests__/order.handlers.test.ts
import { testWithApp } from '@/test-utils/test-with-app'
import { makeFakeOrder } from './__fixtures__/make-fake-order'

describe('POST /orders', () => {
  testWithApp('should create an order and return 201', async ({ app, dbClient }) => {
    const payload = {
      user_id: faker.string.uuid(),
      items: [{ product_id: faker.string.uuid(), quantity: 2 }],
    }

    const res = await app.request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeDefined()
    expect(body.status).toBe('pending')
  })

  testWithApp('should return 422 for invalid body', async ({ app }) => {
    const res = await app.request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'not-a-uuid' }),
    })

    expect(res.status).toBe(422)
  })
})
```

---

## Service Tests (unit — mock dependencies)

See `rules/services.md` for service test patterns — dependencies are mocked via injection.

---

## Rules

- Query tests: use `testWithDbClient` (transaction rollback)
- Handler tests: use `testWithApp` (full HTTP integration)
- Service tests: mock dependencies via injection — no DB, no HTTP
- Always test the error case (`NotFoundError`, validation failure, business rule violation)
- Run tests after creating them: `pnpm test <file_or_folder_path>`
