## Why

We need to improve the organization of course attachments in OneDrive to make them easier to search and manage. By grouping them into main folders by year (Buddhist Era) and creating subfolders based on the start date and course name, we can prevent file and folder name collisions and ensure better long-term maintainability.

## What

Update the course attachment upload process to OneDrive to support dynamic path creation and storage:
1. The new path structure will be: `/{RootFolder}/{Year}/{DD-MM-YYYY}-{CourseName}/{FileName}`
2. **`{Year}`**: Calculated from the Gregorian year of the Start Date plus 543 to convert to the Buddhist Era (BE) year.
3. **`{DD-MM-YYYY}-{CourseName}`**: The specific course folder name (special characters will be sanitized).
4. The folder name will be based on the data provided during the initial upload. It will not be retroactively renamed if the user modifies the course name later.

## Constraints

- Must: Keep new code comments in Thai only.
- Must: Keep edits surgical and limited to files required by this feature.
- Out of Scope: Renaming existing folders when a user updates the course name or start date.

## Execution Strategy

- Branch: `codex/onedrive-dynamic-folder`
- Commit Policy: `1 task = 1 commit` after verify passes
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable:
  - Update the storage contract to accept course details for folder naming.
  - Implement dynamic path creation logic, including date formatting, BE year calculation, and string sanitization.
- User-required:
  - Test the file upload after the implementation is complete to verify the correct path structure in OneDrive.

## Tasks

T1 — Update `CourseAttachmentUploadInput` to accept `courseName` and `startDate` for dynamic path generation. · File: `apps/api/src/modules/courses/storage/course-attachment-storage.contract.ts` · Verify: `pnpm --filter api typecheck`

T2 — Enhance the OneDrive request mapping logic to calculate the BE year, format the date (DD-MM-YYYY), sanitize the folder name, and update `uploadAttachment` to use the dynamic path format `/{RootFolder}/{Year}/{DD-MM-YYYY}-{CourseName}/{FileName}`. · File: `apps/api/src/modules/courses/storage/onedrive-course-attachment-storage.service.ts` · Verify: `pnpm --filter api build`

T3 — Update `CoursesService` to pass the course name and start date to the storage provider when initiating the file upload. · File: `apps/api/src/modules/courses/courses.service.ts` · Verify: `pnpm --filter api typecheck`
