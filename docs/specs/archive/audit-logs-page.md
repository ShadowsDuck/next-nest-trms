## Why

Admins need a dedicated audit log page to review system activity and inspect change history from real database records without leaving the web admin area.

## What

Build a full-stack `Audit Logs` page at `apps/web/app/admin/audit-logs/page.tsx` using the existing project patterns:

- Server-side paginated/filterable audit log list
- Niko Table composition aligned with the employees table pattern
- Row click opens a right-side `Sheet` drawer
- Drawer content limited to:
  - `Activity Overview`
  - `Changes (JSON Diff)`

The page must use real `AuditLog` records, join the related `user`, and present Thai UI copy. The detail UI should stay constrained to the `AuditLog` model fields, with `user.name` / `user.email` allowed only for display.

## Constraints

- Must: follow the existing `apps/web/features/employees/` feature structure and Niko Table pattern
- Must: use `packages/ui/src/components/sheet.tsx` for the right-side drawer
- Must: keep filters server-side only
- Must: support search across `user.name`, `user.email`, `action`, `model`, and `recordId`
- Must: join the `user` relation for display in table and drawer
- Must: use Thai comments in all new implementation code and add a Thai responsibility comment for every new function during `do`
- Must Not: add a `Metadata` section in the drawer
- Must Not: expand the detail payload beyond `AuditLog` fields plus joined user display info
- Out of Scope: create/edit/delete audit logs, analytics widgets, client-side mock data, extra filters beyond the locked set

## Execution Strategy

- Branch: `codex/audit-logs-page`
- Commit Policy: `do` proposes one short commit message per task; actual commits happen in final integration
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable:
  - Existing `AuditLog` Prisma model in `packages/database/prisma/models/audit-logs.prisma`
  - Existing audit logging infrastructure in `apps/api/src/modules/audit-logs/`
  - Existing Niko Table shared components and `Sheet` component already available in the repo
- User-required:
  - No additional input required before implementation

## Tasks

T1 — Add audit log schemas and query contracts · Files: `packages/schemas/src/*`, any required schema exports · Verify: `pnpm --filter @workspace/schemas typecheck`

T2 — Add API list endpoint support for audit log page · Files: `apps/api/src/modules/audit-logs/*` · Verify: backend query DTO and response DTO support server-side pagination plus locked filters (`search`, `date range`, `model`, `action`), including nested relation search on `user.name` and `user.email`

T3 — Add web data layer and URL-state table controller for audit logs · Files: `apps/web/domains/*` and `apps/web/features/audit-logs/hooks/*` as needed · Verify: URL params remain the single source of truth for pagination and filters, and list fetching keeps previous data during refetch

T4 — Build audit log table and toolbar with employees-table pattern · Files: `apps/web/features/audit-logs/components/*` · Verify: table uses Niko Table direct imports, renders the locked columns, supports row click to select/open detail, and exposes only the locked filter set

T5 — Build audit log detail drawer with locked section behavior · Files: `apps/web/features/audit-logs/components/*` · Verify: drawer opens from the right using `Sheet`, shows `Activity Overview`, and applies `Changes` visibility rules exactly:
`Create` = `newValues` only, `Update` = diff, `Delete` = `oldValues` only, `Import`/`Export`/`Failed` = section hidden always

T6 — Wire page entry and run focused verification · Files: `apps/web/app/admin/audit-logs/page.tsx` and any feature exports/imports required · Verify: `pnpm --filter web typecheck`
