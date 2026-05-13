## Why

Current organization-units module contains repetitive try-catch blocks in handlers. Moving to centralized error handling with HTTPException will reduce boilerplate and improve maintainability while keeping type safety strong through chaining.

## What

Refactor organization-units module using **Hybrid Approach**:

- **Error Classes**: Use Hono's HTTPException for all service-layer errors
- **Handlers**: Extract to standalone functions without try-catch blocks
- **Routes**: Chain all endpoints in one file while importing handlers
- **Error Handling**: Implement app.onError for centralized handling

## Constraints

- Must: Use Thai comments for all functions
- Must: Maintain existing endpoint paths and response shapes
- Must: Use HTTPException with appropriate status codes
- Must: Ensure OrganizationUnitsRoute type is fully inferred
- Must Not: Change database schema or business logic

## Execution Strategy

- Branch: `codex/hono-org-units-refactor`
- Commit Policy: 1 task = 1 commit after verify passes
- Merge Policy: run ship only when all tasks done

## Tasks

T1 — Create Global HTTPException Utilities
Files: `apps/api/src/lib/http-errors.ts`
Verify: Utility functions exist:

- throwNotFound(message: string)
- throwConflict(message: string)
- throwBadRequest(message: string)
- throwUnauthorized(message: string)

T2 — Refactor Services to use HTTPException
Files: `apps/api/src/modules/organization-units/services/*.ts`, `organization-units.utils.ts`
Verify: All ensure\*Exists and validation functions use HTTPException utils

T3 — Extract Handlers to Function Exports
Files: `apps/api/src/modules/organization-units/handlers/*.handlers.ts`
Verify: Each handler exported as async function(c: Context<HonoEnv>) without try-catch

T4 — Rebuild Routes with Handler Chaining
File: `apps/api/src/modules/organization-units/organization-units.routes.ts`
Verify: Single Hono instance chains all routes using imported handler functions:

```typescript
const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .get('/plants', zValidator('query', plantQuerySchema), plantsHandlers.getPlants)
  .post('/plants', zValidator('json', plantSchema), plantsHandlers.createPlant)
  // ... etc
```

T5 — Implement Centralized Error Handling
File: `apps/api/src/modules/organization-units/organization-units.routes.ts`
Verify: routes.onError handles HTTPException and returns proper JSON responses

T6 — Integration and Type Check
Files: `apps/api/src/modules/organization-units/index.ts`
Verify: pnpm --filter api build succeeds, OrganizationUnitsRoute type correctly inferred
