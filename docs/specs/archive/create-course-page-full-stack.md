## Why

The system currently has a course listing page but no full create flow. Users cannot add new courses from the web UI, and the API currently exposes only course listing. This blocks course data onboarding and creates an inconsistent UX compared to the existing employee create flow.

## What

Deliver a full-stack "Create Course" flow with:

- A new web create page under `/admin/courses/create` using the same visual pattern as the current employee create page.
- A validated multi-section form (general info, schedule/details, instructor/cost, accreditation/attachments).
- Real save behavior to backend via `POST /courses`.
- Category selection using `tagId` (display `tag.name`, submit `tag.id`).
- Attachment inputs that store filename/path strings (no real file upload backend in this scope).

## Constraints

- Must: follow the existing create-employee page style (no breadcrumb), use Thai UI text, and keep edits surgical.
- Must: enforce business validation for date/time (`startDate <= endDate`, and when same date, `startTime <= endTime`).
- Must: implement end-to-end create behavior (web + api), not UI-only.
- Must Not: add real object storage upload flow in this task.
- Out of Scope: course edit page, attachment storage service, course participant assignment.

## Tasks

- [x] T1 — Add API create endpoint for courses (`POST /courses`) and DTO for create payload. · File: `apps/api/src/modules/courses/courses.controller.ts`, `apps/api/src/modules/courses/courses.service.ts`, `apps/api/src/modules/courses/dto/create-course.dto.ts` · Verify: `pnpm --filter api typecheck`
- [x] T2 — Implement course create persistence and mapping with schema-compatible response. · File: `apps/api/src/modules/courses/courses.service.ts`, `apps/api/src/modules/courses/lib/courses.mapper.ts` · Verify: create request returns `CourseResponseDto` with normalized date/time fields
- [x] T3 — Add web domain action for course creation and export from domain index. · File: `apps/web/domains/courses/actions.ts`, `apps/web/domains/courses/index.ts` · Verify: `pnpm --filter web typecheck`
- [x] T4 — Build create course feature UI and route with employee-create style sections and controls. · File: `apps/web/app/admin/courses/create/page.tsx`, `apps/web/features/courses/create/components/*` · Verify: route renders with 4 section cards, segmented course type, and Thai labels
- [x] T5 — Wire form validation, tag options, submit/redirect flow, and attachment string handling. · File: `apps/web/features/courses/create/schemas/form-schema.ts`, `apps/web/features/courses/create/components/create-course-page.tsx` · Verify: `pnpm --filter web lint` and `pnpm --filter web typecheck`
