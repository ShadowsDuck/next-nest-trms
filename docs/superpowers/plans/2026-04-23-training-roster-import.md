# Training Roster Import Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a completed-roster import workspace that lets HR upload one fixed roster template, preview employee matching and duplicate issues, optionally create a course inline, and bulk-create valid training records.

**Architecture:** Keep the database schema unchanged and treat the import as a stateless dry-run plus commit workflow. Add a dedicated `training-record-imports` module in NestJS, shared Zod contracts in `packages/schemas`, and a new `/admin/activities` workspace in Next.js that reuses the existing upload and action patterns already used for employee CSV import.

**Tech Stack:** Next.js App Router, NestJS, Prisma, PostgreSQL, Zod, React Hook Form, TanStack Query, Papa Parse, Vitest for new web-side tests, Jest for API unit tests.

---

## Planned File Structure

### Shared Contracts

- Create: `packages/schemas/src/training-record-import.schema.ts`
  Responsibility: define import raw-row, course target, dry-run, commit, and response contracts.
- Modify: `packages/schemas/src/index.ts`
  Responsibility: export the new schemas and types.

### API

- Create: `apps/api/src/modules/training-record-imports/training-record-imports.module.ts`
  Responsibility: register controller and service.
- Create: `apps/api/src/modules/training-record-imports/training-record-imports.controller.ts`
  Responsibility: expose `POST /training-record-imports/dry-run` and `POST /training-record-imports/commit`.
- Create: `apps/api/src/modules/training-record-imports/training-record-imports.service.ts`
  Responsibility: validate rows, resolve courses, revalidate on commit, and persist training records with current user IDs.
- Create:
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-dry-run-request.dto.ts`
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-dry-run-response.dto.ts`
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-commit-request.dto.ts`
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-commit-response.dto.ts`
  Responsibility: connect Zod schemas to NestJS request/response validation.
- Create: `apps/api/src/modules/training-record-imports/training-record-imports.service.spec.ts`
  Responsibility: unit-test dry-run and commit behavior with mocked Prisma.
- Modify: `apps/api/src/app.module.ts`
  Responsibility: register the new module.

### Web

- Modify: `apps/web/package.json`
  Responsibility: add a `test` script and the minimal dev dependencies for Vitest and Testing Library.
- Create:
  - `apps/web/vitest.config.ts`
  - `apps/web/vitest.setup.ts`
  Responsibility: enable focused component and parser tests.
- Create: `apps/web/app/admin/activities/page.tsx`
  Responsibility: mount the new workspace at the sidebar route that already exists.
- Create:
  - `apps/web/domains/training-record-imports/actions.ts`
  - `apps/web/domains/training-record-imports/index.ts`
  Responsibility: call the new API endpoints and parse responses with shared Zod schemas.
- Create:
  - `apps/web/features/training-record-imports/components/training-roster-import-page.tsx`
  - `apps/web/features/training-record-imports/components/course-resolution-section.tsx`
  - `apps/web/features/training-record-imports/components/preview-result-table.tsx`
  - `apps/web/features/training-record-imports/components/import-summary-card.tsx`
  Responsibility: implement the upload, course selection/create, preview, and commit UI.
- Create:
  - `apps/web/features/training-record-imports/lib/roster-template.ts`
  - `apps/web/features/training-record-imports/lib/parse-training-roster-csv.ts`
  Responsibility: hold the fixed template definition and file parsing logic.
- Create:
  - `apps/web/features/training-record-imports/lib/parse-training-roster-csv.test.ts`
  - `apps/web/features/training-record-imports/components/training-roster-import-page.test.tsx`
  Responsibility: cover parser and workspace state transitions.
- Create:
  - `apps/web/features/training-record-imports/schemas/course-draft-form-schema.ts`
  - `apps/web/features/training-record-imports/queries/use-training-roster-import-options.ts`
  Responsibility: validate inline course creation and load course/tag options.

## Working Assumption For V1

The approved spec did not define exact roster columns. This plan assumes the fixed roster template contains:

- `รหัสพนักงาน`
- `ชื่อ-นามสกุล`

`รหัสพนักงาน` is the only matching key used by the backend. `ชื่อ-นามสกุล` is surfaced in preview only to help HR visually confirm matches. If the real provider file differs, update `apps/web/features/training-record-imports/lib/roster-template.ts` and the parser tests in Task 5 before implementing the UI.

## Implementation Tasks

### Task 1: Add Shared Import Contracts

**Files:**
- Create: `packages/schemas/src/training-record-import.schema.ts`
- Modify: `packages/schemas/src/index.ts`
- Verify: `packages/schemas/tsconfig.json`

- [ ] **Step 1: Add the new import schema file**

```ts
import * as z from 'zod'
import { accreditationStatus, courseType, courseSchema } from './course.schema'

export const trainingRosterImportStatus = [
  'ready',
  'employee_not_found',
  'duplicate_in_file',
  'already_recorded',
  'invalid_row',
  'skipped',
] as const

export const trainingRosterImportRawRowSchema = z.object({
  sourceRow: z.coerce.number().int().positive(),
  employeeNo: z.unknown().optional(),
  fullName: z.unknown().optional(),
})

export const trainingRosterImportCourseTargetSchema = z.discriminatedUnion(
  'mode',
  [
    z.object({
      mode: z.literal('existing'),
      courseId: z.string().min(1, { message: 'กรุณาเลือกหลักสูตร' }),
    }),
    z.object({
      mode: z.literal('create'),
      draft: courseSchema.extend({
        type: z.enum(courseType),
        accreditationStatus: z.enum(accreditationStatus),
      }),
    }),
  ]
)
```

- [ ] **Step 2: Finish dry-run and commit request/response contracts**

```ts
export const trainingRosterImportPreviewRowSchema = z.object({
  sourceRow: z.number().int().positive(),
  employeeNo: z.string().optional(),
  fullName: z.string().optional(),
  matchedEmployee: z
    .object({
      id: z.string(),
      employeeNo: z.string(),
      fullName: z.string(),
      departmentName: z.string(),
    })
    .optional(),
  status: z.enum(trainingRosterImportStatus),
  reasons: z.array(z.string()),
  canImport: z.boolean(),
})

export const trainingRosterImportDryRunRequestSchema = z.object({
  rows: z.array(trainingRosterImportRawRowSchema).min(1),
  courseTarget: trainingRosterImportCourseTargetSchema,
})

export const trainingRosterImportDryRunResponseSchema = z.object({
  summary: z.object({
    total: z.number().int().nonnegative(),
    ready: z.number().int().nonnegative(),
    invalid: z.number().int().nonnegative(),
    duplicateInFile: z.number().int().nonnegative(),
    employeeNotFound: z.number().int().nonnegative(),
    alreadyRecorded: z.number().int().nonnegative(),
  }),
  course: z.object({
    mode: z.enum(['existing', 'create']),
    valid: z.boolean(),
    courseId: z.string().optional(),
    courseTitle: z.string().optional(),
    reasons: z.array(z.string()).default([]),
  }),
  rows: z.array(trainingRosterImportPreviewRowSchema),
})

export const trainingRosterImportCommitRequestSchema =
  trainingRosterImportDryRunRequestSchema.extend({
    selectedSourceRows: z.array(z.number().int().positive()).optional(),
  })

export const trainingRosterImportCommitResponseSchema = z.object({
  summary: z.object({
    total: z.number().int().nonnegative(),
    imported: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  course: z.object({
    id: z.string(),
    title: z.string(),
  }),
  rows: z.array(
    z.object({
      sourceRow: z.number().int().positive(),
      employeeNo: z.string().optional(),
      status: z.enum(trainingRosterImportStatus),
      ok: z.boolean(),
      error: z.string().optional(),
    })
  ),
})
```

- [ ] **Step 3: Export the new contracts from the package root**

```ts
export * from './employee.schema'
export * from './course.schema'
export * from './training-record.schema'
export * from './training-record-import.schema'
export * from './organization-unit.schema'
export * from './tag.schema'
export * from './summary-report.schema'
```

- [ ] **Step 4: Run schema package typecheck**

Run:

```bash
pnpm --filter @workspace/schemas exec tsc -p tsconfig.json --noEmit
```

Expected: command exits `0` with no missing export or type errors.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/training-record-import.schema.ts packages/schemas/src/index.ts
git commit -m "feat(schemas): add training roster import contracts"
```

### Task 2: Build The API Dry-Run Path

**Files:**
- Create:
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-dry-run-request.dto.ts`
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-dry-run-response.dto.ts`
  - `apps/api/src/modules/training-record-imports/training-record-imports.module.ts`
  - `apps/api/src/modules/training-record-imports/training-record-imports.controller.ts`
  - `apps/api/src/modules/training-record-imports/training-record-imports.service.ts`
  - `apps/api/src/modules/training-record-imports/training-record-imports.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/training-record-imports/training-record-imports.service.spec.ts`

- [ ] **Step 1: Write the failing dry-run unit tests**

```ts
import { TrainingRecordImportsService } from './training-record-imports.service'

describe('TrainingRecordImportsService dryRun', () => {
  const makeService = () => {
    const prismaService = {
      employee: { findMany: jest.fn() },
      trainingRecord: { findMany: jest.fn() },
      course: { findUnique: jest.fn() },
      tag: { findUnique: jest.fn() },
    }

    return {
      prismaService,
      service: new TrainingRecordImportsService(prismaService as never),
    }
  }
})
```

- [ ] **Step 2: Run the service spec to verify it fails**

Run:

```bash
pnpm --filter api test -- src/modules/training-record-imports/training-record-imports.service.spec.ts --runInBand
```

Expected: FAIL with module or method-not-found errors for `TrainingRecordImportsService`.

- [ ] **Step 3: Add DTO and controller/module scaffolding**

```ts
import { trainingRosterImportDryRunRequestSchema } from '@workspace/schemas'
import { createZodDto } from 'nestjs-zod'

export class TrainingRecordImportDryRunRequestDto extends createZodDto(
  trainingRosterImportDryRunRequestSchema
) {}
```

```ts
import { Controller, Post, Body } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { TrainingRecordImportDryRunRequestDto } from './dto/training-record-import-dry-run-request.dto'
import { TrainingRecordImportDryRunResponseDto } from './dto/training-record-import-dry-run-response.dto'
import { TrainingRecordImportsService } from './training-record-imports.service'

@Controller('training-record-imports')
export class TrainingRecordImportsController {
  constructor(
    private readonly trainingRecordImportsService: TrainingRecordImportsService
  ) {}

  @Post('dry-run')
  @ZodResponse({
    status: 200,
    type: TrainingRecordImportDryRunResponseDto,
  })
  async dryRun(
    @Body() body: TrainingRecordImportDryRunRequestDto
  ): Promise<TrainingRecordImportDryRunResponseDto> {
    return this.trainingRecordImportsService.dryRun(body)
  }
}
```

```ts
@Module({
  imports: [PrismaModule],
  controllers: [TrainingRecordImportsController],
  providers: [TrainingRecordImportsService],
})
export class TrainingRecordImportsModule {}
```

- [ ] **Step 4: Implement the minimal dry-run service**

```ts
type DryRunInput = TrainingRecordImportDryRunRequestDto

@Injectable()
export class TrainingRecordImportsService {
  constructor(private readonly prismaService: PrismaService) {}

  // ตรวจข้อมูลจาก roster โดยยังไม่บันทึก training record จริง
  async dryRun(input: DryRunInput): Promise<TrainingRecordImportDryRunResponseDto> {
    const normalizedRows = input.rows.map((row) => ({
      sourceRow: row.sourceRow,
      employeeNo: this.normalizeString(row.employeeNo),
      fullName: this.normalizeString(row.fullName),
    }))

    const course = await this.resolveCourseForDryRun(input.courseTarget)
    const duplicateEmployeeNos = this.collectDuplicateEmployeeNos(normalizedRows)
    const employees = await this.findEmployeesByEmployeeNo(normalizedRows)
    const existingRecords = await this.findExistingTrainingRecords(
      course.courseId,
      employees.map((employee) => employee.id)
    )

    const rows = normalizedRows.map((row) =>
      this.buildPreviewRow(row, employees, duplicateEmployeeNos, existingRecords)
    )

    return {
      summary: this.summarizePreviewRows(rows),
      course,
      rows,
    }
  }
}
```

- [ ] **Step 5: Register the module in `AppModule`**

```ts
import { TrainingRecordImportsModule } from './modules/training-record-imports/training-record-imports.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BetterAuthModule.forRoot({ auth }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    CoursesModule,
    EmployeesModule,
    TrainingRecordImportsModule,
    HealthModule,
    OrganizationUnitsModule,
    SummaryReportsModule,
    TagsModule,
    UsersModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run the service spec again**

Run:

```bash
pnpm --filter api test -- src/modules/training-record-imports/training-record-imports.service.spec.ts --runInBand
```

Expected: PASS for the dry-run scenarios in Step 1.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/app.module.ts apps/api/src/modules/training-record-imports
git commit -m "feat(api): add training roster import dry-run"
```

### Task 3: Implement Commit For Existing Courses

**Files:**
- Create:
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-commit-request.dto.ts`
  - `apps/api/src/modules/training-record-imports/dto/training-record-import-commit-response.dto.ts`
- Modify:
  - `apps/api/src/modules/training-record-imports/training-record-imports.controller.ts`
  - `apps/api/src/modules/training-record-imports/training-record-imports.service.ts`
  - `apps/api/src/modules/training-record-imports/training-record-imports.service.spec.ts`

- [ ] **Step 1: Add failing commit tests for the existing-course path**

```ts
it('imports only selected ready rows for an existing course', async () => {
  const { service, prismaService } = makeService()

  prismaService.course.findUnique.mockResolvedValue({
    id: 'course-1',
    title: 'หลักสูตรทดลอง',
  })
  prismaService.employee.findMany.mockResolvedValue([
    {
      id: 'emp-1',
      employeeNo: '1001',
      firstName: 'Somchai',
      lastName: 'Jaidee',
      department: { name: 'HR' },
    },
  ])
  prismaService.trainingRecord.findMany.mockResolvedValue([])
  prismaService.$transaction = jest.fn(async (callback) => {
    const tx = {
      trainingRecord: { create: jest.fn().mockResolvedValue({ id: 'tr-1' }) },
    }
    return callback(tx)
  })

  const result = await service.commit('user-1', {
    courseTarget: { mode: 'existing', courseId: 'course-1' },
    rows: [{ sourceRow: 2, employeeNo: '1001', fullName: 'Somchai Jaidee' }],
    selectedSourceRows: [2],
  })

  expect(result.summary.imported).toBe(1)
  expect(result.course.id).toBe('course-1')
})
```

- [ ] **Step 2: Run the spec and verify commit tests fail**

Run:

```bash
pnpm --filter api test -- src/modules/training-record-imports/training-record-imports.service.spec.ts --runInBand
```

Expected: FAIL because `commit` is not implemented.

- [ ] **Step 3: Add the commit DTOs and controller endpoint with current session**

```ts
import { Session, type UserSession } from '@thallesp/nestjs-better-auth'

@Post('commit')
@ZodResponse({
  status: 201,
  type: TrainingRecordImportCommitResponseDto,
})
async commit(
  @Session() session: UserSession,
  @Body() body: TrainingRecordImportCommitRequestDto
): Promise<TrainingRecordImportCommitResponseDto> {
  return this.trainingRecordImportsService.commit(session.user.id, body)
}
```

- [ ] **Step 4: Implement commit for existing courses**

```ts
// บันทึก training record จากแถวที่ผ่าน dry-run และถูกเลือกให้ import
async commit(
  userId: string,
  input: TrainingRecordImportCommitRequestDto
): Promise<TrainingRecordImportCommitResponseDto> {
  const selectedSourceRows = new Set(
    input.selectedSourceRows ?? input.rows.map((row) => row.sourceRow)
  )

  const revalidatedPreview = await this.dryRun(input)
  const readyRows = revalidatedPreview.rows.filter(
    (row) => selectedSourceRows.has(row.sourceRow) && row.status === 'ready'
  )

  const importedRows: TrainingRecordImportCommitResponseDto['rows'] = []
  await this.prismaService.$transaction(async (tx) => {
    for (const row of readyRows) {
      await tx.trainingRecord.create({
        data: {
          employeeId: row.matchedEmployee!.id,
          courseId: revalidatedPreview.course.courseId!,
          certFilePath: null,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
      })

      importedRows.push({
        sourceRow: row.sourceRow,
        employeeNo: row.employeeNo,
        status: 'ready',
        ok: true,
      })
    }
  })

  const failedRows = revalidatedPreview.rows
    .filter((row) => selectedSourceRows.has(row.sourceRow) && row.status !== 'ready')
    .map((row) => ({
      sourceRow: row.sourceRow,
      employeeNo: row.employeeNo,
      status: row.status,
      ok: false,
      error: row.reasons.join(', '),
    }))

  return {
    summary: {
      total: [...selectedSourceRows].length,
      imported: importedRows.length,
      skipped: 0,
      failed: failedRows.length,
    },
    course: {
      id: revalidatedPreview.course.courseId!,
      title: revalidatedPreview.course.courseTitle!,
    },
    rows: [...importedRows, ...failedRows].sort((a, b) => a.sourceRow - b.sourceRow),
  }
}
```

- [ ] **Step 5: Run the API spec**

Run:

```bash
pnpm --filter api test -- src/modules/training-record-imports/training-record-imports.service.spec.ts --runInBand
```

Expected: PASS for dry-run and existing-course commit scenarios.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/training-record-imports
git commit -m "feat(api): add training roster import commit flow"
```

### Task 4: Support Inline Course Creation In Commit And Dry-Run

**Files:**
- Modify:
  - `apps/api/src/modules/training-record-imports/training-record-imports.service.ts`
  - `apps/api/src/modules/training-record-imports/training-record-imports.service.spec.ts`

- [ ] **Step 1: Add failing tests for the create-course path**

```ts
it('accepts a valid new course draft during dry-run', async () => {
  const { service, prismaService } = makeService()

  prismaService.tag.findUnique.mockResolvedValueOnce({ id: 'tag-1', name: 'Soft Skill' })
  prismaService.employee.findMany.mockResolvedValueOnce([])
  prismaService.trainingRecord.findMany.mockResolvedValueOnce([])

  const result = await service.dryRun({
    courseTarget: {
      mode: 'create',
      draft: {
        title: 'หลักสูตรใหม่',
        type: 'Internal',
        startDate: '2026-04-01',
        endDate: '2026-04-01',
        startTime: null,
        endTime: null,
        duration: 3,
        lecturer: null,
        institute: null,
        expense: 0,
        accreditationStatus: 'Pending',
        accreditationFilePath: null,
        attendanceFilePath: null,
        tagId: 'tag-1',
      },
    },
    rows: [{ sourceRow: 2, employeeNo: '1001', fullName: 'Somchai Jaidee' }],
  })

  expect(result.course.valid).toBe(true)
  expect(result.course.mode).toBe('create')
})
```

- [ ] **Step 2: Run the spec and confirm the new tests fail**

Run:

```bash
pnpm --filter api test -- src/modules/training-record-imports/training-record-imports.service.spec.ts --runInBand
```

Expected: FAIL on the create-course scenarios.

- [ ] **Step 3: Add course-draft validation and persistence helpers**

```ts
// ตรวจความถูกต้องของ courseTarget และคืนข้อมูลที่ใช้ต่อใน dry-run/commit
private async resolveCourseForDryRun(
  courseTarget: TrainingRosterImportCourseTarget
): Promise<TrainingRecordImportDryRunResponseDto['course']> {
  if (courseTarget.mode === 'existing') {
    const course = await this.prismaService.course.findUnique({
      where: { id: courseTarget.courseId },
      select: { id: true, title: true },
    })

    return course
      ? { mode: 'existing', valid: true, courseId: course.id, courseTitle: course.title, reasons: [] }
      : { mode: 'existing', valid: false, reasons: ['ไม่พบหลักสูตรที่เลือก'] }
  }

  const tag = await this.prismaService.tag.findUnique({
    where: { id: courseTarget.draft.tagId },
    select: { id: true },
  })

  return tag
    ? { mode: 'create', valid: true, courseTitle: courseTarget.draft.title, reasons: [] }
    : { mode: 'create', valid: false, reasons: ['ไม่พบหมวดหมู่หลักสูตรที่เลือก'] }
}
```

```ts
// สร้าง course ใหม่เมื่อผู้ใช้เลือก create mode ระหว่าง commit
private async createCourseFromDraft(
  tx: Prisma.TransactionClient,
  draft: TrainingRosterImportCourseDraft
) {
  return tx.course.create({
    data: {
      title: draft.title,
      type: draft.type,
      startDate: new Date(draft.startDate),
      endDate: new Date(draft.endDate),
      startTime: draft.startTime ? new Date(`1970-01-01T${draft.startTime}Z`) : null,
      endTime: draft.endTime ? new Date(`1970-01-01T${draft.endTime}Z`) : null,
      duration: draft.duration,
      lecturer: draft.lecturer ?? null,
      institute: draft.institute ?? null,
      expense: draft.expense,
      accreditationStatus: draft.accreditationStatus,
      accreditationFilePath: draft.accreditationFilePath ?? null,
      attendanceFilePath: draft.attendanceFilePath ?? null,
      tagId: draft.tagId,
    },
    select: { id: true, title: true },
  })
}
```

- [ ] **Step 4: Update commit to create the course inside the transaction when needed**

```ts
await this.prismaService.$transaction(async (tx) => {
  const course =
    input.courseTarget.mode === 'create'
      ? await this.createCourseFromDraft(tx, input.courseTarget.draft)
      : {
          id: revalidatedPreview.course.courseId!,
          title: revalidatedPreview.course.courseTitle!,
        }

  for (const row of readyRows) {
    await tx.trainingRecord.create({
      data: {
        employeeId: row.matchedEmployee!.id,
        courseId: course.id,
        certFilePath: null,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
    })
  }
})
```

- [ ] **Step 5: Run API tests and full API typecheck**

Run:

```bash
pnpm --filter api test -- src/modules/training-record-imports/training-record-imports.service.spec.ts --runInBand
pnpm --filter api exec tsc -p tsconfig.json --noEmit
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/training-record-imports
git commit -m "feat(api): support inline course creation during import"
```

### Task 5: Add Web Test Setup And CSV Parser

**Files:**
- Modify: `apps/web/package.json`
- Create:
  - `apps/web/vitest.config.ts`
  - `apps/web/vitest.setup.ts`
  - `apps/web/features/training-record-imports/lib/roster-template.ts`
  - `apps/web/features/training-record-imports/lib/parse-training-roster-csv.ts`
  - `apps/web/features/training-record-imports/lib/parse-training-roster-csv.test.ts`

- [ ] **Step 1: Add the failing parser test**

```ts
import { describe, expect, it } from 'vitest'
import { parseTrainingRosterCsv } from './parse-training-roster-csv'

describe('parseTrainingRosterCsv', () => {
  it('maps the fixed roster template into API rows', async () => {
    const file = new File(
      ['รหัสพนักงาน,ชื่อ-นามสกุล\n1001,Somchai Jaidee\n1002,Suda Dee'],
      'training.csv',
      { type: 'text/csv' }
    )

    const result = await parseTrainingRosterCsv(file)

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      { sourceRow: 2, employeeNo: '1001', fullName: 'Somchai Jaidee' },
      { sourceRow: 3, employeeNo: '1002', fullName: 'Suda Dee' },
    ])
  })
})
```

- [ ] **Step 2: Add minimal test infrastructure**

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "format": "prettier --write \"**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

- [ ] **Step 3: Implement the roster template constant and parser**

```ts
export const TRAINING_ROSTER_TEMPLATE_COLUMNS = ['รหัสพนักงาน', 'ชื่อ-นามสกุล'] as const
```

```ts
import Papa from 'papaparse'
import type { TrainingRosterImportRawRow } from '@workspace/schemas'
import { TRAINING_ROSTER_TEMPLATE_COLUMNS } from './roster-template'

type CsvRowRecord = Record<string, string | undefined>

// แปลงไฟล์ roster CSV ให้เป็นแถวที่ backend ใช้ตรวจสอบได้
export async function parseTrainingRosterCsv(file: File): Promise<{
  rows: TrainingRosterImportRawRow[]
  errors: string[]
}> {
  const result = await new Promise<Papa.ParseResult<CsvRowRecord>>((resolve, reject) => {
    Papa.parse<CsvRowRecord>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: resolve,
      error: reject,
    })
  })

  const parsedHeaders = (result.meta.fields ?? []).map((field) => field.trim())
  const missingColumns = TRAINING_ROSTER_TEMPLATE_COLUMNS.filter(
    (column) => !parsedHeaders.includes(column)
  )

  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [`ไฟล์ CSV ไม่มีคอลัมน์ที่จำเป็น: ${missingColumns.join(', ')}`],
    }
  }

  return {
    rows: result.data.map((row, index) => ({
      sourceRow: index + 2,
      employeeNo: row['รหัสพนักงาน'],
      fullName: row['ชื่อ-นามสกุล'],
    })),
    errors: [],
  }
}
```

- [ ] **Step 4: Run the parser test**

Run:

```bash
pnpm --filter web test -- apps/web/features/training-record-imports/lib/parse-training-roster-csv.test.ts
```

Expected: PASS for the parser scenarios.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/vitest.setup.ts apps/web/features/training-record-imports/lib
git commit -m "test(web): add training roster parser coverage"
```

### Task 6: Add Web Domain Actions And Route Shell

**Files:**
- Create:
  - `apps/web/app/admin/activities/page.tsx`
  - `apps/web/domains/training-record-imports/actions.ts`
  - `apps/web/domains/training-record-imports/index.ts`
  - `apps/web/features/training-record-imports/schemas/course-draft-form-schema.ts`
  - `apps/web/features/training-record-imports/queries/use-training-roster-import-options.ts`

- [ ] **Step 1: Add the route shell and action layer**

```tsx
import { TrainingRosterImportPage } from '@/features/training-record-imports/components/training-roster-import-page'

export default function ActivitiesPage() {
  return <TrainingRosterImportPage />
}
```

```ts
'use server'

import {
  type TrainingRosterImportCommitRequest,
  type TrainingRosterImportCommitResponse,
  type TrainingRosterImportDryRunRequest,
  type TrainingRosterImportDryRunResponse,
  trainingRosterImportCommitResponseSchema,
  trainingRosterImportDryRunResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'

export async function dryRunTrainingRosterImport(
  payload: TrainingRosterImportDryRunRequest
): Promise<TrainingRosterImportDryRunResponse> {
  const data = await api.post<TrainingRosterImportDryRunResponse>(
    '/api/training-record-imports/dry-run',
    payload
  )

  return trainingRosterImportDryRunResponseSchema.parse(data)
}
```

- [ ] **Step 2: Add the course draft form schema and options hook**

```ts
import * as z from 'zod'

export const courseDraftFormSchema = z.object({
  title: z.string().min(1, 'กรุณากรอกชื่อหลักสูตร'),
  type: z.enum(['Internal', 'External']),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มต้น'),
  endDate: z.string().min(1, 'กรุณาเลือกวันที่สิ้นสุด'),
  duration: z.coerce.number().nonnegative(),
  tagId: z.string().min(1, 'กรุณาเลือกหมวดหมู่หลักสูตร'),
})
```

```ts
export function useTrainingRosterImportOptions() {
  return useQuery({
    queryKey: ['training-roster-import-options'],
    queryFn: async () => ({
      courses: (await getAllCourses({ page: 1, limit: 100 })).data,
      tags: await getAllTags(),
    }),
  })
}
```

- [ ] **Step 3: Run web typecheck**

Run:

```bash
pnpm --filter web typecheck
```

Expected: PASS with no missing import or route errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/admin/activities/page.tsx apps/web/domains/training-record-imports apps/web/features/training-record-imports/schemas apps/web/features/training-record-imports/queries
git commit -m "feat(web): add training roster import route and actions"
```

### Task 7: Build The Upload, Dry-Run, And Preview Workspace

**Files:**
- Create:
  - `apps/web/features/training-record-imports/components/training-roster-import-page.tsx`
  - `apps/web/features/training-record-imports/components/preview-result-table.tsx`
  - `apps/web/features/training-record-imports/components/training-roster-import-page.test.tsx`

- [ ] **Step 1: Add the failing workspace component test**

```tsx
import { render, screen } from '@testing-library/react'
import { TrainingRosterImportPage } from './training-roster-import-page'

it('disables commit when there are no ready rows', () => {
  render(<TrainingRosterImportPage />)

  expect(
    screen.getByRole('button', { name: 'นำเข้าและบันทึก' })
  ).toBeDisabled()
})
```

- [ ] **Step 2: Implement the upload and dry-run state**

```tsx
'use client'

export function TrainingRosterImportPage() {
  const [rows, setRows] = useState<TrainingRosterImportRawRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [dryRunResult, setDryRunResult] =
    useState<TrainingRosterImportDryRunResponse | null>(null)
  const [isDryRunning, setIsDryRunning] = useState(false)

  const [{ files, isDragging }, uploadActions] = useFileUpload({
    accept: '.csv,text/csv',
    multiple: false,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onFilesChange: async (newFiles) => {
      const file = newFiles[0]?.file
      if (!(file instanceof File)) {
        setRows([])
        return
      }

      const parsed = await parseTrainingRosterCsv(file)
      setRows(parsed.rows)
      setParseErrors(parsed.errors)
    },
  })

  async function handleDryRun() {
    setIsDryRunning(true)
    try {
      const result = await dryRunTrainingRosterImport({
        rows,
        courseTarget: { mode: 'existing', courseId: selectedCourseId },
      })
      setDryRunResult(result)
    } finally {
      setIsDryRunning(false)
    }
  }
}
```

- [ ] **Step 3: Render the preview summary and table**

```tsx
export function PreviewResultTable({
  rows,
}: {
  rows: TrainingRosterImportDryRunResponse['rows']
}) {
  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-[96px_120px_1fr_140px_1fr] gap-3 border-b px-4 py-2 text-sm font-medium">
        <span>แถว</span>
        <span>รหัสพนักงาน</span>
        <span>ชื่อที่จับคู่</span>
        <span>สถานะ</span>
        <span>เหตุผล</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.sourceRow}
          className="grid grid-cols-[96px_120px_1fr_140px_1fr] gap-3 px-4 py-3 text-sm"
        >
          <span>{row.sourceRow}</span>
          <span>{row.employeeNo ?? '-'}</span>
          <span>{row.matchedEmployee?.fullName ?? row.fullName ?? '-'}</span>
          <span>{row.status}</span>
          <span>{row.reasons.join(', ') || '-'}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the workspace component test and web typecheck**

Run:

```bash
pnpm --filter web test -- apps/web/features/training-record-imports/components/training-roster-import-page.test.tsx
pnpm --filter web typecheck
```

Expected: both commands exit `0`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/training-record-imports/components
git commit -m "feat(web): add training roster dry-run workspace"
```

### Task 8: Add Course Resolution And Final Commit UX

**Files:**
- Create:
  - `apps/web/features/training-record-imports/components/course-resolution-section.tsx`
  - `apps/web/features/training-record-imports/components/import-summary-card.tsx`
- Modify:
  - `apps/web/features/training-record-imports/components/training-roster-import-page.tsx`
  - `apps/web/features/training-record-imports/components/training-roster-import-page.test.tsx`

- [ ] **Step 1: Add failing UI tests for preview and final summary**

```tsx
it('renders preview rows after dry-run succeeds', async () => {
  render(<TrainingRosterImportPage />)

  expect(await screen.findByText('ready')).toBeInTheDocument()
})

it('shows the import summary after commit succeeds', async () => {
  render(<TrainingRosterImportPage />)

  expect(await screen.findByText('นำเข้าสำเร็จ 1 รายการ')).toBeInTheDocument()
})
```

- [ ] **Step 2: Implement course resolution UI**

```tsx
export function CourseResolutionSection({
  mode,
  onModeChange,
  selectedCourseId,
  courseForm,
  courses,
  tags,
}: Props) {
  return (
    <div className="rounded-lg border p-4">
      <RadioGroup value={mode} onValueChange={onModeChange}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="existing" id="existing-course" />
          <Label htmlFor="existing-course">ใช้หลักสูตรที่มีอยู่แล้ว</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="create" id="create-course" />
          <Label htmlFor="create-course">สร้างหลักสูตรใหม่พร้อมนำเข้า</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
```

- [ ] **Step 3: Implement commit and final summary rendering**

```tsx
async function handleCommit() {
  if (!dryRunResult) return

  const result = await commitTrainingRosterImport({
    rows,
    courseTarget: buildCourseTargetFromForm(),
    selectedSourceRows: dryRunResult.rows
      .filter((row) => row.canImport)
      .map((row) => row.sourceRow),
  })

  setImportResult(result)
  toast.success(`นำเข้าสำเร็จ ${result.summary.imported} รายการ`)
}
```

```tsx
export function ImportSummaryCard({
  result,
}: {
  result: TrainingRosterImportCommitResponse
}) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-base font-semibold">ผลการนำเข้า</h2>
      <p className="text-sm text-muted-foreground">
        นำเข้าสำเร็จ {result.summary.imported} รายการ
      </p>
      <p className="text-sm text-muted-foreground">
        หลักสูตร: {result.course.title}
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Run the web test suite, lint, and typecheck**

Run:

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web typecheck
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/training-record-imports
git commit -m "feat(web): complete training roster import workflow"
```

### Task 9: Full-System Verification

**Files:**
- Verify only:
  - `apps/api/src/modules/training-record-imports/**`
  - `apps/web/app/admin/activities/page.tsx`
  - `apps/web/domains/training-record-imports/**`
  - `apps/web/features/training-record-imports/**`
  - `packages/schemas/src/training-record-import.schema.ts`

- [ ] **Step 1: Run focused API tests**

Run:

```bash
pnpm --filter api test -- src/modules/training-record-imports/training-record-imports.service.spec.ts --runInBand
```

Expected: PASS for dry-run, duplicate, create-course, and commit revalidation scenarios.

- [ ] **Step 2: Run full package typechecks**

Run:

```bash
pnpm --filter @workspace/schemas exec tsc -p tsconfig.json --noEmit
pnpm --filter api exec tsc -p tsconfig.json --noEmit
pnpm --filter web typecheck
```

Expected: all commands exit `0`.

- [ ] **Step 3: Run web tests and lint**

Run:

```bash
pnpm --filter web test
pnpm --filter web lint
```

Expected: all commands exit `0`.

- [ ] **Step 4: Manual verification with a real sample roster**

Run the app locally:

```bash
pnpm dev
```

Manual checks:

1. Open `/admin/activities`.
2. Upload a roster with one valid employee and one missing employee.
3. Verify dry-run shows `ready` for the valid row and `employee_not_found` for the invalid row.
4. Repeat with `Use existing course`.
5. Repeat with `Create course now`.
6. After commit, verify the new rows appear under the selected or newly created course on `/admin/courses`.
7. Re-upload the same roster and verify dry-run now marks the same employee as `already_recorded`.

Expected: the UI matches the spec and invalid rows do not block valid imports.

- [ ] **Step 5: Final commit**

```bash
git add packages/schemas apps/api apps/web
git commit -m "feat: add completed training roster import workspace"
```

## Self-Review

### Spec Coverage

- Dry-run preview: covered by Tasks 1, 2, and 7.
- Existing course or create course inline: covered by Tasks 4 and 8.
- Commit valid rows only: covered by Task 3.
- Revalidation at commit time: covered by Task 3 tests and implementation.
- `/admin/activities` workspace and preview table: covered by Tasks 6, 7, and 8.
- Parser and UI verification: covered by Tasks 5, 7, 8, and 9.

No spec gaps remain.

### Placeholder Scan

This plan intentionally avoids placeholder markers and vague “handle appropriately” language. The only explicit assumption is the V1 roster column set, and the file to update if the real provider template differs is named directly.

### Type Consistency

- Shared types consistently use `trainingRosterImport*` names in `packages/schemas`.
- API DTOs and web actions reference the same schema names.
- The route is consistently `/api/training-record-imports/*` on the backend and `/admin/activities` on the frontend.
