# Employee Table Redesign

## Why

We need to improve the Employee Table interface to align with the "Minimalist Enterprise" design guidelines shown in the reference image. The goal is to make the interface cleaner, more organized, and easier to use by grouping tools and actions logically.

## What

1. **Update Page Header:** Move the page title ("Employees") and description to the top left. Relocate the action buttons ("Import", "Export", "+ Add Employee") to the top right.
2. **Update Filter Toolbar:**
   - Arrange the toolbar in a single row: starting with the Search input on the left.
   - Followed by the 4 most frequently used dropdown filters: Job Level, Division, Department, and Status.
   - Implement a "More filters" button that opens a Popover containing any remaining filters (e.g., Prefix) to keep the main toolbar uncluttered.
3. **Display Adjustments:** Adjust spacing, paddings, and colors of the table and toolbar to closely match the "Minimalist Enterprise" reference image. We will continue using the existing data fields and Thai language text.
4. **Global Design System Refinements:** Standardize global UI elements for a more premium feel, including reduced border-radius (7px), consistent button/input heights (h-9), and streamlined component spacing.
5. **Minimalist Column Sorting:** Replace complex sorting popovers with direct-toggle header sorting using minimalist chevron icons and removing active click animations.

## Context

**Relevant files:**

- `apps/web/features/employees/components/filter-toolbar.tsx`
- `apps/web/features/employees/components/employee-table.tsx`
- `apps/web/features/employees/components/columns.tsx` (if spacing/padding adjustments are needed)

## Constraints

### Must

- Use Thai comments for all new code/functions.
- Use existing data and filters. Change only the UI layout and styling.
- Utilize existing Niko Table components where applicable.

### Must Not

- Do not add any new data fields or columns that require database or schema changes.

## Tasks

### [x] T1: Refactor Header and Action Buttons

**What:** Update `filter-toolbar.tsx` (and `employee-table.tsx` if necessary) to place the "Import", "Export", and "Add Employee" buttons at the top right of the page header, on the same line as the page title.
**Files:** `apps/web/features/employees/components/filter-toolbar.tsx`
**Verify:** Check the UI to ensure action buttons are at the top right and fully functional.

### [x] T2: Refactor Filter Toolbar and Search

**What:** Adjust the layout of the filter toolbar to be on a single row. The order should be: Search input, then the 4 main dropdown filters (Job Level, Division, Department, Status).
**Files:** `apps/web/features/employees/components/filter-toolbar.tsx`
**Verify:** Ensure the toolbar items sit on a single line and all 4 main filters are clearly visible.

### [x] T3: Implement "More Filters" Popover

**What:** Move less frequently used filters (e.g., Prefix) into a Popover that is triggered by a new "More filters" button in the toolbar.
**Files:** `apps/web/features/employees/components/filter-toolbar.tsx`
**Verify:** Clicking "More filters" should open a popover displaying the "Prefix" filter.

### [x] T4: Apply Minimalist Enterprise Styling

**What:** Review and adjust the spacing, colors, and overall aesthetics of the Filter Toolbar and Table to match the "Minimalist Enterprise" design reference.

- Make the search input shorter and fixed width.
- Replace the `PlusCircle` icon with an animated `ChevronDown` (which rotates to `ChevronUp` when opened) in the faceted filters.
- Standardize global `radius` to `7px` and `Button`/`Input` heights to `h-9`.
  **Files:** `apps/web/features/employees/components/filter-toolbar.tsx`, `apps/web/shared/components/niko-table/filters/table-faceted-filter.tsx`, `packages/ui/src/styles/globals.css`
  **Verify:** The overall interface feels clean, premium, and matches the reference design.

### [x] T5: Refactor Column Sorting

**What:** Convert `DataTableColumnSortMenu` from a dropdown menu to a direct toggle button with 3-state sorting (None, Asc, Desc).

- Use `ChevronUp`, `ChevronDown`, and `ChevronsUpDown` icons.
- Move icons to sit directly next to the column title.
- Remove the 1px shift on click for a more stable UI.
  **Files:** `apps/web/shared/components/niko-table/filters/table-column-sort.tsx`, `apps/web/shared/components/niko-table/components/data-table-column-header.tsx`
  **Verify:** Clicking header icons toggles sort state directly without popovers.

## Validation

- The layout accurately reflects the design reference (Header, Filter Toolbar).
- All filters function as they did before.
- No new data fields or columns have been introduced.
