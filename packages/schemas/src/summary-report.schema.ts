import * as z from "zod"
import { courseQuerySchema, courseResponseSchema } from "./course.schema"
import { employeeQuerySchema, employeeResponseSchema } from "./employee.schema"

export const summaryReportSourceSchema = z.enum(["employees", "courses"])

export const employeeSummaryReportSnapshotSchema = z.object({
  source: z.literal("employees"),
  selectedIds: z.array(z.string().min(1)),
  generatedAt: z.iso.datetime(),
  filtersSnapshot: employeeQuerySchema,
  employees: z.array(employeeResponseSchema),
})

export const courseSummaryReportSnapshotSchema = z.object({
  source: z.literal("courses"),
  selectedIds: z.array(z.string().min(1)),
  generatedAt: z.iso.datetime(),
  filtersSnapshot: courseQuerySchema,
  courses: z.array(courseResponseSchema),
})

export const summaryReportSnapshotSchema = z.discriminatedUnion("source", [
  employeeSummaryReportSnapshotSchema,
  courseSummaryReportSnapshotSchema,
])

export const createEmployeeSummaryReportSchema = z.object({
  source: z.literal("employees"),
  selectedIds: z.array(z.string().min(1)).min(1),
  filtersSnapshot: employeeQuerySchema,
})

export const createCourseSummaryReportSchema = z.object({
  source: z.literal("courses"),
  selectedIds: z.array(z.string().min(1)).min(1),
  filtersSnapshot: courseQuerySchema,
})

export const createSummaryReportSchema = z.discriminatedUnion("source", [
  createEmployeeSummaryReportSchema,
  createCourseSummaryReportSchema,
])

export const createSummaryReportRequestSchema = z.object({
  source: summaryReportSourceSchema,
  selectedIds: z.array(z.string().min(1)).min(1),
  filtersSnapshot: z.unknown(),
})

export const createSummaryReportResponseSchema = z.object({
  reportId: z.string(),
})

export const summaryReportResponseSchema = z.object({
  id: z.string(),
  source: summaryReportSourceSchema,
  generatedAt: z.iso.datetime(),
  selectedIds: z.array(z.string().min(1)),
  filtersSnapshot: z.union([employeeQuerySchema, courseQuerySchema]),
  reportSnapshot: summaryReportSnapshotSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type SummaryReportSource = z.infer<typeof summaryReportSourceSchema>
export type EmployeeSummaryReportSnapshot = z.infer<
  typeof employeeSummaryReportSnapshotSchema
>
export type CourseSummaryReportSnapshot = z.infer<
  typeof courseSummaryReportSnapshotSchema
>
export type SummaryReportSnapshot = z.infer<typeof summaryReportSnapshotSchema>
export type CreateSummaryReport = z.infer<typeof createSummaryReportSchema>
export type CreateSummaryReportRequest = z.infer<
  typeof createSummaryReportRequestSchema
>
export type CreateSummaryReportResponse = z.infer<
  typeof createSummaryReportResponseSchema
>
export type SummaryReportResponse = z.infer<typeof summaryReportResponseSchema>
