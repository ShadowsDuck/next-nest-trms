## Why

To enforce secure, permission-based access control (PBAC) across all API endpoints, ensuring users can only perform actions authorized for their roles. This provides a solid foundation for identify-linked audit logging.

## What

Configure `better-auth` access control in `auth.ts` with explicit permissions for each module (Courses, Employees, Tags, Reports, etc.). Apply `@UserHasPermission` guards to all relevant controller endpoints in the NestJS API.

## Constraints

- Must: Use Thai comments in new code.
- Must: Use Permission-based access control (PBAC) via `@UserHasPermission`.
- Must: Match the defined roles:
  - Admin: Full Access.
  - Manager: `read`, `create`, `update`, `import` (No `delete`).
  - Employee: `read` only.
- Out of Scope: UI changes for role management.

## Execution Strategy

- Branch: `codex/auth-guard-implementation`
- Commit Policy: `1 task = 1 commit` after verify passes
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Backend uses `@thallesp/nestjs-better-auth`.
- Auth configuration is in `apps/api/src/auth/auth.ts`.

## Tasks

T1 — Define Permissions in `auth.ts` · File: `apps/api/src/auth/auth.ts` · Verify: `ac.statements` includes `course`, `employee`, `tag`, `report`, `orgUnit`.
T2 — Define Roles (Admin, Manager, Employee) in `auth.ts` · File: `apps/api/src/auth/auth.ts` · Verify: Roles assigned correct permissions according to the plan.
T3 — Secure Courses Controller · File: `apps/api/src/modules/courses/courses.controller.ts` · Verify: `@UserHasPermission` added to `create`, `findAll`, etc.
T4 — Secure Employees Controller · File: `apps/api/src/modules/employees/employees.controller.ts` · Verify: `@UserHasPermission` added to `create`, `findAll`, `import`, etc.
T5 — Secure Tags and OrgUnits Controllers · Files: `apps/api/src/modules/tags/tags.controller.ts`, `apps/api/src/modules/organization-units/organization-units.controller.ts` · Verify: `@UserHasPermission` added to endpoints.
T6 — Secure Summary Reports Controller · File: `apps/api/src/modules/summary-reports/summary-reports.controller.ts` · Verify: `@UserHasPermission` added to `create`, `findLatest`, etc.
