## Why

To provide a robust audit trail for critical system actions, ensuring accountability, data integrity, and easier debugging of historical changes.

## What

Implement a manual audit logging system in the NestJS API. This includes a dedicated `AuditLogModule` and integration into `Courses` and `Employees` modules to record Create, Update, Delete, and Import actions.

## Constraints

- Must: Use Thai comments in new code.
- Must: Use manual logging in services (surgical approach).
- Must: Capture `oldValues` and `newValues` for updates.
- Must: Capture `userId`, `ipAddress`, and `userAgent`.
- Must: Handle all `AuditAction` enum values (Create, Update, Delete, Import, Export, Failed).
- Must Not: Use global Prisma middleware/extensions (to maintain explicit context).
- Out of Scope: UI for viewing logs.

## Execution Strategy

- Branch: `codex/audit-log-implementation`
- Commit Policy: `1 task = 1 commit` after verify passes
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- DB schema has `AuditLog` model in `packages/database/prisma/models/audit-logs.prisma`.
- User session is available via `@thallesp/nestjs-better-auth`.

## Tasks

T1 — Verify DB Schema and Generate Client · File: `packages/database/package.json` · Verify: `pnpm --filter @workspace/database db:generate`
T2 — Create AuditLog Module and Service · File: `apps/api/src/modules/audit-logs/audit-logs.service.ts` · Verify: Service handles all `AuditAction` types.
T3 — Integrate AuditLog into Courses Module · File: `apps/api/src/modules/courses/courses.service.ts` · Verify: Logs created for Create, Update, Delete, and Failed (on error).
T4 — Integrate AuditLog into Employees Module · File: `apps/api/src/modules/employees/employees.service.ts` · Verify: Logs created for Create, Update, Delete, and Failed.
T5 — Integrate AuditLog into Employee Import · File: `apps/api/src/modules/employees/employee-import.service.ts` · Verify: Logs created for Import and Failed actions.
T6 — Update Controllers to pass Context · Files: `apps/api/src/modules/courses/courses.controller.ts`, `apps/api/src/modules/employees/employees.controller.ts` · Verify: Context (userId, ipAddress, userAgent) is consistently passed to all mutating service methods.
