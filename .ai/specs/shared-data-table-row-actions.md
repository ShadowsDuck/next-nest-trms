# Shared Data Table Row Actions

## Why
Currently, the action columns in our data tables (Courses, Employees) are just disabled placeholder icons. We need a functional, consistent, and reusable dropdown menu for row-level actions like "View Details", "Edit", and "Delete".

## What
A new shared component `DataTableRowActions` integrated into the Niko Table system, which provides a standard dropdown menu for table rows.

## Context
**Relevant files:**
- `apps/web/shared/components/niko-table/components/data-table-row-actions.tsx` (New)
- `apps/web/features/courses/components/columns.tsx`
- `apps/web/features/employees/components/columns.tsx`
- `packages/ui/src/components/dropdown-menu.tsx`

**Patterns to follow:**
- Use shadcn/ui components from `@workspace/ui/components`.
- Use Lucide icons for visual consistency.

## Constraints
### Must
- Use Thai comments for all new code/functions.
- Follow the "Surgical changes" rule—only modify the `actions` column in existing files.
- Support both `viewHref`/`editHref` (for navigation) and optional `onDelete` (for actions).
- Use `DropdownMenu` with proper accessibility labels.

### Must Not
- Do not add new dependencies.
- Do not change the overall table structure or other columns.

## Tasks

### T1: Create DataTableRowActions component
**What:** Implement the shared component in the shared Niko Table directory. It should support optional labels and icons for View, Edit, and Delete.
**Files:** `apps/web/shared/components/niko-table/components/data-table-row-actions.tsx`
**Verify:** Check if the file exports the component and uses `DropdownMenu` correctly.

### T2: Integrate into Course Table
**What:** Replace the placeholder action button in `apps/web/features/courses/components/columns.tsx` with the new `DataTableRowActions` component.
**Files:** `apps/web/features/courses/components/columns.tsx`
**Verify:** Ensure the dropdown appears in the Course table with "ดูรายละเอียด" and "แก้ไข" links.

### T3: Integrate into Employee Table
**What:** Replace the placeholder action button in `apps/web/features/employees/components/columns.tsx` with the new `DataTableRowActions` component.
**Files:** `apps/web/features/employees/components/columns.tsx`
**Verify:** Ensure the dropdown appears in the Employee table with correct links.

## Validation
- All dropdowns open correctly.
- Links point to the correct admin routes (e.g., `/admin/courses/[id]`).
- UI looks premium and follows the provided design.
