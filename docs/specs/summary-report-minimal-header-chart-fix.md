# Spec: Summary Report Minimal Header and Chart Restore

## Why

The summary report page still looks visually heavy compared to the provided reference design. The header needs to be flatter and more minimal, with the primary actions placed on the right in a compact row. At the same time, the report charts disappeared after the recent `recharts` package update, so the shared chart wrapper must be restored to keep the report usable.

## What

- Refactor the summary report header to match the reference layout:
  - Keep the existing title and description text.
  - Show the source and generated-time badges on the left.
  - Move the action buttons to the right.
  - Use `ล้างข้อมูล` and `ส่งออก` as the two header actions.
  - Render the export action as UI only for now; do not wire any export behavior.
- Make the summary report page feel more minimal by reducing unnecessary decoration around the header and card surfaces.
- Restore chart rendering across the app by updating the shared chart wrapper used by summary report charts.

## Constraints

- Must use Thai comments for any new functions or complex logic.
- Must keep the existing report data and analytics logic unchanged.
- Must not add export backend behavior in this change.
- Must not change unrelated screens or data models.
- Must keep the change surgical and limited to the minimal files required.

## Execution Strategy

- Branch: `codex/summary-report-minimal-header-chart-fix`
- Commit Policy: one doc commit for the spec and dashboard update only
- Merge Policy: after implementation, verify the page visually and confirm chart rendering before any merge

## Prerequisites

- Agent-doable:
  - Review the current summary report page structure.
  - Update the shared chart wrapper if the Recharts 3.8.1 upgrade changed container behavior.
  - Adjust the header layout and button set to match the reference.
- User-required:
  - None beyond the already approved design direction.

## Tasks

### T1: Refactor the Summary Report Header

Update `apps/web/features/summary-report/components/summary-report-page.tsx` so the header matches the reference layout more closely.

- Keep the current report title and subtitle text.
- Keep the existing source and timestamp badges.
- Remove the heavy card-like treatment from the header.
- Place the `ล้างข้อมูล` and `ส่งออก` actions on the right side.
- Keep the export action as a UI-only button with an icon.

Verify:

- The header reads as a flat minimal strip instead of a prominent card.
- The title and description remain unchanged.
- Both right-side actions are visible and aligned.

### T2: Restore Chart Rendering in the Shared Wrapper

Update `packages/ui/src/components/chart.tsx` so charts render correctly after the `recharts` upgrade.

- Keep the `ChartContainer`, `ChartTooltip`, and `ChartTooltipContent` API stable for existing callers.
- Fix the container behavior so responsive charts receive a valid size and display correctly.
- Preserve the existing chart styling hooks and CSS variables.

Verify:

- The summary report charts render again instead of showing empty white panels.
- Existing chart usage in the app continues to compile with the same imports.

### T3: Polish the Summary Report Card Surface

Tune the summary report page card styling so the page feels closer to the provided minimalist reference without removing information.

- Reduce visual weight from borders, shadows, and decorative backgrounds.
- Keep all existing report sections intact.
- Keep tables, charts, and analytics content unchanged.

Verify:

- The page still shows all existing sections.
- The visual density is lower than the current version.

## Validation

- The summary report header matches the intended flat reference style.
- The `ส่งออก` button is present as UI only.
- All charts in the summary report render after the wrapper update.
- No report data fields, tables, or analytics calculations change.
