# Course Table Redesign

## Why
The current `CourseTable` component does not match the newly established "Minimalist Enterprise" design language recently implemented in the `EmployeeTable`. We need to align the course table UI (specifically the toolbar header, action buttons, and filter sizes) to maintain a consistent user experience across the application.

## What
Redesign the `CourseTableFilterToolbar` to match the exact structure, layout, and visual styling of `EmployeeTableFilterToolbar`. This includes adding a page subtitle, reorganizing the action buttons (Import, Export, Create), and standardizing the sizing of the table's filter controls.

## Constraints
- **Must**: Apply surgical changes to `apps/web/features/courses/components/filter-toolbar.tsx`.
- **Must**: Include Thai comments for all new sections.
- **Must**: Implement the "Import" button as UI only (no functionality).
- **Must Not**: Alter any existing table logic, data fetching, or pagination functions.
- **Must Not**: Change any styles in the root layout or files outside the `course-table` component scope.

## Tasks

### [x] T1: Update Header Section Layout in CourseTableFilterToolbar
- **Target**: `apps/web/features/courses/components/filter-toolbar.tsx`
- **Logic**:
  - Replace the current simple `h1` and `Button` layout in the first `DataTableToolbarSection` with a flex-col layout.
  - Add the subtitle: `จัดการและดูข้อมูลหลักสูตรทั้งหมดได้ในที่เดียว`.
  - Add the "นำเข้า" (Import) button with a `Download` icon (UI only).
  - Convert the "ส่งออก" (Export) action from the second section's ellipsis menu into a `DropdownMenu` with a standard `Upload` icon, matching the layout used in `EmployeeTableFilterToolbar`.
  - Update the "สร้างหลักสูตรใหม่" (Create Course) button to match the styling.
- **Verify**: The header area visually matches the Employee page with the new title, subtitle, and grouped action buttons on the right.

### [x] T2: Standardize Filter Controls Sizing
- **Target**: `apps/web/features/courses/components/filter-toolbar.tsx`
- **Logic**:
  - Modify the `DataTableSearchFilter` to have `className="w-[350px] flex-none"`.
  - Ensure the `DataTableClearFilter` has `size="lg"` and `className="h-9"`.
  - Update the "รีเฟรชข้อมูล" (Refresh) button to use `size="lg"` and be placed at the end (`ml-auto`) in the filter section.
  - Wrap the search, faceted filters, and refresh button inside the second `DataTableToolbarSection` with `className="w-full flex-wrap gap-3 px-0"`.
- **Verify**: The filter bar elements are sized and arranged identically to the employee table.
