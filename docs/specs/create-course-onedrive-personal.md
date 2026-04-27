## Why

The current cloud-file direction is blocked for a free personal setup with Google Drive service-account constraints. We need a storage approach that works with a free personal account now, stays simple for non-technical users, and can later move to Microsoft 365 organization mode without rewriting core course-creation logic.

## What

Replace the course attachment storage integration with OneDrive using a single central Microsoft personal account first, while preserving the existing create-course flow and API/web behavior:

- Upload both optional attachments (`accreditationFile`, `attendanceFile`) to OneDrive.
- Store resulting attachment metadata/path data in course persistence.
- Keep create-course behavior atomic from user perspective (upload before create, rollback uploaded files on downstream failure).
- Keep web create flow as multipart upload with existing UI structure.
- Introduce provider abstraction so migration from personal account mode to Microsoft 365 organization mode is primarily configuration/auth changes, not business-logic rewrites.

## Constraints

- Must: keep edits surgical and limited to files required by this feature.
- Must: keep new code comments in Thai only.
- Must: add Thai responsibility comments for every new function.
- Must: keep file validation behavior unchanged (allowed types and 10 MB max per file).
- Must: use one central OneDrive target folder configured by environment variable.
- Must: preserve create-course UX (no additional user login steps in the form flow).
- Must Not: require each end user to connect their own OneDrive account.
- Must Not: introduce unrelated UI redesign or course-domain refactor beyond storage abstraction needs.
- Out of Scope: Google Drive dual-write, background async sync pipeline, multi-provider runtime switching UI.

## Execution Strategy

- Branch: `codex/create-course-onedrive-personal`
- Commit Policy: `1 task = 1 commit` after verify passes
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable:
  - Implement OneDrive storage adapter and integrate it with existing create-course flow.
  - Add/adjust API + web wiring and verification commands.
  - Update env example and implementation notes for personal/organization mode transition.
- User-required:
  - Register Microsoft app credentials and grant required OneDrive scopes.
  - Configure real secrets in `apps/api/.env`.
  - Prepare and share target OneDrive folder for the central account.
  - Validate tenant/account policies when moving to organization mode.

## Tasks

T1 — Introduce storage abstraction for course attachments and prepare OneDrive provider contract in the API module. · File: `apps/api/src/modules/courses/*` · Verify: `pnpm --filter api build`

T2 — Implement OneDrive personal-account upload/delete service (central account) and return normalized attachment metadata for persistence. · File: `apps/api/src/modules/courses/*` · Verify: service-level upload and delete paths compile and return expected metadata shape

T3 — Wire create-course atomic transaction flow to OneDrive service: upload attachments first, rollback uploaded files on any subsequent failure, then persist course. · File: `apps/api/src/modules/courses/courses.service.ts` and related storage files · Verify: create-course path compiles and rollback code path exists for both upload-stage and persistence-stage failures

T4 — Keep web create flow multipart-compatible and provider-agnostic so existing UI/submit behavior remains stable. · File: `apps/web/features/courses/create/*`, `apps/web/domains/courses/actions.ts` (if needed) · Verify: `pnpm --filter web typecheck` and `pnpm --filter web lint`

T5 — Add migration-ready environment/config documentation for personal mode now and organization mode later (minimal code-path changes required for migration). · File: `apps/api/.env.example`, relevant backend docs/readme sections · Verify: env keys and migration notes are explicit, non-ambiguous, and consistent with implemented auth flow
