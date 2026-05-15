# Spec: Breadcrumb Header Implementation

## Why
Currently, the `SiteHeader` only displays the title of the current page if it matches exactly with the navigation data. This doesn't provide enough context for nested routes (e.g., editing an employee). Implementing a breadcrumb-style header will improve user navigation and context awareness.

## What
- Replace the single title in `SiteHeader` with a dynamic breadcrumb.
- The breadcrumb will consist of up to 3 levels:
  1. **Menu Group**: "เมนูหลัก", "รายงาน", or "ระบบ" based on which section of the sidebar the route belongs to.
  2. **Main Page**: The title of the navigation item (e.g., "ข้อมูลพนักงาน").
  3. **Action**: A Thai translation of the sub-path segment (e.g., `create` -> `เพิ่มข้อมูล`, `edit` -> `แก้ไข`).

## Constraints
- **Thai Comments**: All new functions and complex logic must have Thai comments.
- **Surgical Changes**: Only modify `apps/web/shared/components/sidebar/site-header.tsx`.
- **Aesthetics**: Use a premium design with `text-muted-foreground` for non-active parts of the breadcrumb.
- **Sub-path Mapping**: Handle common actions like `create`, `edit`, and `summary`.

## Tasks

### T1: Implement Breadcrumb Logic in `SiteHeader`
- [x] Parse `pathname` to find the corresponding item in `data.navMain`, `data.report`, or `data.setting`.
- [x] Determine the group label.
- [x] Extract sub-path segments and map them to Thai labels.
- [x] Render the breadcrumb with `/` separators.
- **Verify**: Navigate to `/admin/employees`, `/admin/employees/create`, and `/admin/reports/summary` to ensure correct display.

### T2: Styling & Polish
- [x] Apply `text-muted-foreground` and appropriate font weights to distinguish between levels.
- [x] Ensure proper spacing and alignment.
- **Verify**: Visual check against the requested breadcrumb style.
