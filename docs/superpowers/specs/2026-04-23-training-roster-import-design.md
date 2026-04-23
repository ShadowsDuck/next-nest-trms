# Training Roster Import Workspace Design

Date: 2026-04-23
Project: Next-Nest-TRMS
Status: Proposed

## Problem

The system is used as a post-training record keeper. HR receives a completed training
roster after the training has already happened, then manually:

1. matches each roster row to an employee record
2. creates training records one employee at a time
3. fixes messy roster data before import

The current system centralizes data, but it does not reduce enough manual work
compared with Excel for this workflow.

## Goal

Add a completed roster import workspace that lets HR:

- upload one fixed completed-roster template
- select an existing course or create a new course in the same flow
- preview row-by-row import results before writing real data
- bulk-create valid training records in one action
- isolate invalid rows so they can be fixed without blocking the full import

## Non-Goals

This feature will not include:

- planning or approval workflow
- compliance tracking or mandatory course logic
- employee-side attendance follow-up
- OCR, PDF parsing, or certificate extraction
- multiple roster templates
- fuzzy employee matching by name
- a new permanent training-session entity

## Users

- HR staff members who maintain completed training records

## Current Constraints

- The primary input is a completed roster or attendance sheet.
- The roster is mostly one fixed template from the same source.
- Matching is usually deterministic because the roster includes `employeeNo`.
- The course is not always created before participant records are entered.
- Reporting is useful but is not the main bottleneck for this feature.

## Proposed Feature

Introduce a `Completed Roster Import Workspace`.

The workspace is a guided flow for converting a completed roster into real
training records using a dry-run preview first and a commit step second.

The final source of truth remains the existing `training_records` table.
The workspace is an intake process, not a new permanent business object.

## Why This Approach

This design directly targets the real bottlenecks:

- employee matching
- repetitive one-by-one training record creation
- messy roster cleanup before import

It also matches an existing pattern already present in the codebase:
employee import uses a dry-run phase followed by a real import phase with
row-level validation.

## User Workflow

1. HR opens `Import Training Roster`.
2. HR uploads the fixed-template roster file.
3. HR chooses one of two course paths:
   - use an existing course
   - create a new course in the same flow
4. The system parses and normalizes the uploaded rows.
5. The system validates each row and matches employees by `employeeNo`.
6. The system checks whether the selected or newly created course would cause
   duplicate training records.
7. The system shows a preview table with row statuses and reasons.
8. HR reviews only the flagged rows.
9. HR commits valid rows in one bulk action.
10. The system returns a final import summary.

## Scope For V1

V1 will support:

- one fixed roster template only
- employee matching by `employeeNo` only
- existing-course selection
- inline course creation
- preview before commit
- row-level validation results
- bulk creation of valid training records
- final summary after commit

V1 will not support:

- editing spreadsheet cells directly inside the app
- template mapping UI
- alternate employee matching strategies
- attachment handling during roster import

## Domain Boundaries

### Keep Existing Final Record Model

The existing `training_records` table remains the final persisted record of
training completion.

This feature should not add a new permanent `training_session` or
`training_import_batch` table in V1.

Reason:

- lower implementation risk
- lower migration cost
- keeps the feature aligned with the current post-training-only scope

### Course Handling

The import flow must support both:

- selecting an existing `course`
- creating a new `course` inline during the import process

The inline new-course path is necessary because HR sometimes imports the roster
before the course exists in the system.

## Data And Validation Design

### Input

The backend receives:

- roster rows parsed from the fixed template
- either:
  - an existing `courseId`
  - or a new-course draft payload

### Row Processing Pipeline

Each uploaded row goes through:

1. normalization
2. schema validation
3. duplicate detection inside the uploaded file
4. employee lookup by `employeeNo`
5. duplicate detection against existing `training_records`

### Recommended Row States

- `ready`
  The row is valid and can be imported.
- `employee_not_found`
  `employeeNo` does not match an employee in the system.
- `duplicate_in_file`
  The same employee appears more than once in the uploaded roster.
- `already_recorded`
  A training record already exists for the resolved employee and course.
- `invalid_row`
  Required fields are missing or invalid in the roster row.
- `skipped`
  The row was left out of commit by user choice or commit-time revalidation.

### Preview Response Shape

The dry-run response should contain:

- summary
  - total rows
  - ready rows
  - invalid rows
  - duplicate rows
  - already-recorded rows
- course resolution result
  - existing course selected, or
  - new course draft valid/invalid
- per-row preview
  - source row
  - employeeNo
  - matched employee metadata when found
  - row status
  - reasons

### Commit Behavior

Commit should import valid rows only.

This is preferable to all-or-nothing import because the user’s main bottleneck is
throughput. A small number of bad rows should not block a large set of valid rows.

## Important Existing Model Constraint

The current schema defines a unique constraint on:

- `training_records(employeeId, courseId)`

This means one employee can only have one training record per course row.

Practical implication:

- if the same course title is reused across different completed runs, HR may need
  to create a separate `course` row for each completed run

V1 design decision:

- keep the current uniqueness rule
- make the import flow explicit that HR can create a new course row for a new
  completed run
- do not redesign the course/session model in this feature

If repeated runs later become a persistent modeling problem, a separate
session-oriented redesign can be planned as a later feature.

## API Design

Add a dedicated backend module for training roster import rather than attaching
this logic to the employee import module.

Recommended endpoints:

### `POST /training-record-imports/dry-run`

Purpose:

- parse, validate, preview, and resolve course input without writing final records

Request:

- roster rows
- existing `courseId` or new-course draft payload

Response:

- summary counts
- course validation result
- row-level preview results

### `POST /training-record-imports/commit`

Purpose:

- create the course if needed
- bulk-create valid `training_records`

Request:

- validated roster payload
- course selection or new-course draft
- rows selected for import

Response:

- created count
- skipped count
- failed rows with reasons

## Transaction And Consistency Rules

### Existing Course Path

When importing into an existing course:

- revalidate rows during commit
- create valid `training_records` inside a transaction

### New Course Path

When creating a new course during import:

- create the `course`
- create valid `training_records`
- do both inside the same transaction

### Revalidation At Commit Time

The system must recheck duplicate conditions at commit time because data can
change between dry-run and commit.

Example:

- another user may create a conflicting training record after preview but before commit

In that case:

- the conflicting row should fail with a clear reason
- non-conflicting valid rows should still be imported

## UI Design

### Flow

1. File upload
2. Course resolution
3. Preview table
4. Commit summary

### Step 1: File Upload

Show:

- upload control
- fixed template guidance
- detected row count after parse

### Step 2: Course Resolution

Show:

- search/select existing course
- or compact inline course creation form

### Step 3: Preview Table

Recommended columns:

- source row
- employeeNo
- matched employee
- status
- reason

Recommended behavior:

- filter to flagged rows
- show counts by status
- disable commit if there are zero `ready` rows

### Step 4: Commit Summary

Show:

- total uploaded
- total imported
- total skipped
- total failed
- row-level failures that still need manual handling

## Error Handling

The system should prefer explicit row-level feedback over generic import failure.

Expected error categories:

- template format invalid
- required column missing
- employee not found
- duplicate employee in uploaded file
- course input invalid
- training record already exists
- commit-time conflict caused by concurrent changes

Each error should map to a clear user-facing reason in the preview or result summary.

## Testing Strategy

### Backend

Add tests for:

- parser and normalizer for the fixed roster template
- dry-run with all rows valid
- dry-run with missing employee
- dry-run with duplicate employee in file
- dry-run with already-recorded training row
- dry-run with invalid new-course payload
- commit with existing course
- commit with inline course creation
- commit with mixed valid and invalid rows
- commit with a duplicate detected between preview and commit

### Frontend

Add tests for:

- upload flow reaching preview state
- course selection versus course creation path
- preview row-state rendering
- commit disabled when there are no valid rows
- final summary after successful commit

## Delivery Plan

Recommended implementation order:

1. backend dry-run validation contract
2. backend commit transaction
3. shared schemas for import request and response payloads
4. web import workspace UI
5. verification with a real sample roster
6. focused UX refinement based on HR feedback

## Success Criteria

The feature is successful when:

- HR can import one completed roster and create most training records in one pass
- HR no longer has to create standard training records one employee at a time
- invalid rows are isolated and explained before commit
- duplicate records are prevented reliably
- the same workflow supports both existing-course and new-course cases

## Open Assumptions Chosen For This Design

To avoid ambiguity, this design explicitly assumes:

- only one roster template is supported in V1
- `employeeNo` is the only employee matching key in V1
- a new `course` row may represent a distinct completed run under the current model
- reporting enhancements are out of scope for this feature because they are not the
  main bottleneck

## Risks

- The current `course` model may eventually become too coarse if one course title
  is reused across many completed sessions.
- If the fixed roster template changes upstream, the parser will need maintenance.
- If HR later needs partial row editing inside the app, V1 may feel too rigid and
  require a second iteration.

## Recommendation

Proceed with this design as V1 because it is the smallest feature that materially
reduces HR’s post-training data-entry workload without expanding into planning,
approval, or broader domain redesign.
