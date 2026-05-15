## Why

Admins can already browse the employee list, but they still cannot open a single employee record to inspect profile details, organization placement, training history, and certificate availability in one place. The approved design requires a dedicated detail page backed by real employee and training data instead of a mock UI.

## What

Build a full-stack `Employee Detail` page at `/admin/employees/[employeeNo]` using real records from the existing employee and training models.

- Add a dedicated employee detail API lookup by `employeeNo`
- Render the approved layout with:
  - employee header with name, `employeeNo`, job level, and status
  - summary stat cards derived from real training records
  - general information section
  - organization hierarchy section
  - training history table
  - certificate preview modal
- Align employee table `View` and `Edit` links to use `employeeNo` in URLs
- Use Thai UI text throughout the page while keeping record values unchanged

## How it works

- The employee table row actions navigate to `/admin/employees/[employeeNo]` for view and `/admin/employees/[employeeNo]/edit` for edit, so employee routing uses one business identifier consistently.
- The web page fetches one employee by `employeeNo` from a dedicated API endpoint that returns organization names plus related `trainingRecords`.
- The page computes the four summary cards directly from returned training data, including total trainings, total hours, certificate count, and the most recent training date.
- The training history table paginates the returned `trainingRecords` on the client to match the approved detail-page layout without introducing a second nested list endpoint.
- When a training row has `certFilePath`, the certificate action opens a modal preview with a download CTA; when the row has no certificate path, the action stays disabled.

## Constraints

- Must: follow the existing `apps/web/features/employees/` structure and reuse established project UI patterns where practical
- Must: use Thai UI copy for headings, labels, buttons, table text, empty states, and pagination text
- Must: use real API data only; no mock employee or training data in the shipped page
- Must: use `employeeNo` as the route key for detail lookup and employee list navigation
- Must: use a modal interaction for certificate preview, not a floating preview card
- Must: keep missing-certificate behavior explicit by disabling the certificate action when `certFilePath` is absent
- Must: keep new implementation comments in Thai and add a Thai responsibility comment for every new function during `do`
- Must Not: add `email` or `phone` fields to the employee model or header UI
- Must Not: implement employee edit behavior in this spec
- Must Not: implement employee detail PDF export in this spec
- Must Not: introduce a separate backend pagination API just for nested training history unless implementation is blocked without it
- Out of Scope: create/edit employee forms, export employee detail PDF, new contact fields, redesign of unrelated employee list features

## Execution Strategy

- Branch: `codex/employee-detail`
- Commit Policy: `do` proposes concise implementation commits; final integration stays separate from this draft
- Merge Policy: run `ship` only after all implementation tasks are complete and verified

## Prerequisites

- Agent-doable:
  - Existing employee list page and row actions in `apps/web/features/employees/`
  - Existing employee/training schemas in `packages/schemas/src/`
  - Existing employee module and mapper in `apps/api/src/modules/employees/`
  - Existing `Dialog` component in `@workspace/ui/components/dialog`
  - Existing `certFilePath` field on training records
- User-required:
  - Certificate files referenced by `certFilePath` must be accessible in the target environment for real preview/download QA

## Tasks

T1 — Add employee detail schema contract for one-record responses · Files: `packages/schemas/src/employee.schema.ts`, related schema exports if needed · Verify: `pnpm typecheck`

T2 — Add backend employee detail lookup by `employeeNo` · Files: `apps/api/src/modules/employees/*` · Verify: `pnpm --filter api build`

T3 — Align employee table row action URLs to `employeeNo` and add the web data access seam for detail fetches · Files: `apps/web/features/employees/components/columns.tsx`, `apps/web/domains/employees/*` as needed · Verify: employee list actions generate `/admin/employees/<employeeNo>` and `/admin/employees/<employeeNo>/edit`

T4 — Build the employee detail page shell and real-data summary sections · Files: `apps/web/app/admin/employees/[employeeNo]/page.tsx`, `apps/web/features/employees/detail/components/*` as needed · Verify: `pnpm --filter web typecheck`

T5 — Build the training history table with Thai copy, client-side pagination, and disabled certificate action rules · Files: `apps/web/features/employees/detail/components/*` · Verify: training history renders from `trainingRecords`, paginates locally, and disables certificate actions for rows without `certFilePath`

T6 — Build the certificate preview modal and browser-usable certificate download flow · Files: `apps/web/features/employees/detail/components/*`, backend/web certificate URL seam only if required for browser access · Verify: clicking a row with `certFilePath` opens the modal and exposes a working download target

T7 — Run focused end-to-end verification for the new detail route · Files: wiring files touched by T1-T6 only · Verify: `pnpm typecheck` and manual page check at `/admin/employees/[employeeNo]` with one seeded employee record
