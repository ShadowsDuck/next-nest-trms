## Why

The Employee Detail feature has become complex with several responsibilities mixed in a single page component. Specifically, the certificate preview logic, static domain mapping dictionaries, and a custom pagination component are currently localized within the page and table files, making them hard to reuse and increasing the cognitive load of the main feature logic.

## What

Refactor the Employee Detail feature to deepen the architecture by:
1. Extracting the `EmployeeCertificateDialog` into a dedicated deep component.
2. Centralizing static domain dictionaries (course type, employee status, prefix) into the library layer.
3. Extracting the numbered pagination logic into a reusable `DataTableNumberedPagination` component within the shared `niko-table` library.

## How it works

- **Task 1**: Move `EmployeeCertificateDialog` from `employee-detail-page.tsx` to `components/employee-certificate-dialog.tsx`.
- **Task 2**: Relocate `courseTypeLabelByValue`, `statusLabelByValue`, and `prefixLabelByValue` to `lib/employee-detail.ts`. Create and export pure formatter functions: `getCourseTypeLabel`, `getStatusLabel`, and `getPrefixLabel`.
- **Task 3**: Create `apps/web/shared/components/niko-table/components/data-table-numbered-pagination.tsx` by porting the logic from `TrainingHistoryPagination`. Update `EmployeeTrainingHistoryTable` to use this new shared component.

## Constraints

- Must: Use Thai comments in code for new or modified functions.
- Must: Perform surgical edits only, maintaining existing styling and behavior.
- Must Not: Alter the UI design or visual appearance of the feature.

## Execution Strategy

- Branch: `codex/employee-detail-deepening`
- Commit Policy: One commit per task.
- Merge Policy: Run `ship` only when all tasks are done and committed.

## Prerequisites

- Agent-doable: All tasks are internal refactors.
- User-required: None.

## Tasks

T1 — Extract `EmployeeCertificateDialog` · File: `apps/web/features/employees/detail/components/employee-certificate-dialog.tsx` · Verify: Ensure the dialog opens and previews certificates correctly from the detail page.
T2 — Consolidate domain dictionaries and formatters · File: `apps/web/features/employees/detail/lib/employee-detail.ts` · Verify: Check that labels in the page and table columns display correctly.
T3 — Create `DataTableNumberedPagination` in `niko-table` · File: `apps/web/shared/components/niko-table/components/data-table-numbered-pagination.tsx` · Verify: Confirm the training history table pagination functions correctly with numbered buttons and ellipses.
T4 — Cleanup and integration · File: `apps/web/features/employees/detail/components/employee-detail-page.tsx` · Verify: Run `pnpm typecheck` in `apps/web` and confirm 0 errors.
