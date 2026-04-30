import * as z from "zod"
import { toArray } from "./lib/zod-helper"
import { trainingRecordResponseSchema } from "./training-record.schema"

export const prefix = ["Mr", "Mrs", "Miss"] as const
export const jobLevel = ["S1", "S2", "M1", "M2"] as const
export const employeeStatus = ["Active", "Resigned"] as const

// Default Schema
export const employeeSchema = z.object({
  employeeNo: z.string().min(1, { message: "รหัสพนักงานห้ามว่าง" }),
  prefix: z.enum(prefix, { message: "คำนำหน้าไม่ถูกต้อง" }),
  firstName: z.string().min(1, { message: "ชื่อห้ามว่าง" }),
  lastName: z.string().min(1, { message: "นามสกุลห้ามว่าง" }),
  idCardNo: z
    .string()
    .length(13, { message: "เลขบัตรประชาชนต้องมี 13 หลัก" })
    .regex(/^\d{13}$/, { message: "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น" })
    .nullable()
    .optional(),
  hireDate: z.iso.date().nullable().optional(),
  jobLevel: z.enum(jobLevel, { message: "ระดับตำแหน่งไม่ถูกต้อง" }),
  status: z.enum(employeeStatus, { message: "สถานะไม่ถูกต้อง" }),
  plantId: z.string().min(1, { message: "Plant ห้ามว่าง" }),
  buId: z.string().min(1, { message: "Business Unit ห้ามว่าง" }),
  functionId: z.string().min(1, { message: "Function ห้ามว่าง" }),
  divisionId: z.string().min(1, { message: "Division ห้ามว่าง" }),
  departmentId: z.string().min(1, { message: "Department ห้ามว่าง" }),
})

// Response Schema
export const employeeResponseSchema = employeeSchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  plantName: z.string(),
  buName: z.string(),
  functionName: z.string(),
  divisionName: z.string(),
  departmentName: z.string(),
  trainingRecords: z.array(trainingRecordResponseSchema),
})

// Pagination Response Schema
export const employeePaginationResponseSchema = z.object({
  data: z.array(employeeResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

// Query Schema
export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1).default(1),
  limit: z.coerce.number().int().positive().max(100).catch(25).default(25),
  search: z.string().optional(),
  prefix: z.pipe(toArray, z.array(z.enum(prefix))).optional(),
  jobLevel: z.pipe(toArray, z.array(z.enum(jobLevel))).optional(),
  divisionName: z.pipe(toArray, z.array(z.string().min(1))).optional(),
  departmentName: z.pipe(toArray, z.array(z.string().min(1))).optional(),
  status: z.pipe(toArray, z.array(z.enum(employeeStatus))).optional(),
  includeTrainingRecords: z.coerce.boolean().optional(),
})

// Import CSV Schema
export const employeeImportRawRowSchema = z.object({
  sourceRow: z.coerce.number().int().positive(),
  employeeNo: z.unknown().optional(),
  prefix: z.unknown().optional(),
  fullName: z.unknown().optional(),
  idCardNo: z.unknown().optional(),
  hireDate: z.unknown().optional(),
  jobLevel: z.unknown().optional(),
  plantName: z.unknown().optional(),
  buName: z.unknown().optional(),
  functionName: z.unknown().optional(),
  divisionName: z.unknown().optional(),
  departmentName: z.unknown().optional(),
})

export const employeeImportRowSchema = z.object({
  sourceRow: z.number().int().positive(),
  employeeNo: z.string().min(1, { message: "รหัสพนักงานห้ามว่าง" }),
  prefix: z.enum(prefix, { message: "คำนำหน้าไม่ถูกต้อง" }),
  fullName: z.string().min(1, { message: "ชื่อ-นามสกุลห้ามว่าง" }),
  idCardNo: z
    .string()
    .length(13, { message: "เลขบัตรประชาชนต้องมี 13 หลัก" })
    .regex(/^\d{13}$/, { message: "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น" })
    .optional(),
  hireDate: z.string().optional(),
  jobLevel: z.enum(jobLevel, { message: "ระดับตำแหน่งไม่ถูกต้อง" }),
  plantName: z.string().min(1, { message: "Plant ห้ามว่าง" }),
  buName: z.string().min(1, { message: "BU ห้ามว่าง" }),
  functionName: z.string().min(1, { message: "สายงานห้ามว่าง" }),
  divisionName: z.string().min(1, { message: "ฝ่ายห้ามว่าง" }),
  departmentName: z.string().min(1, { message: "ส่วนงานห้ามว่าง" }),
})

export const employeeImportDryRunRequestSchema = z.object({
  rows: z.array(employeeImportRawRowSchema),
})

export const employeeImportDryRunRowResultSchema = z.object({
  sourceRow: z.number().int().positive(),
  employeeNo: z.string().optional(),
  ok: z.boolean(),
  errors: z.array(z.string()),
})

export const employeeImportDryRunResponseSchema = z.object({
  summary: z.object({
    total: z.number().int().nonnegative(),
    valid: z.number().int().nonnegative(),
    invalid: z.number().int().nonnegative(),
  }),
  rows: z.array(employeeImportDryRunRowResultSchema),
})

export const employeeImportRequestSchema = employeeImportDryRunRequestSchema

export const employeeImportRowResultSchema = z.object({
  sourceRow: z.number().int().positive(),
  employeeNo: z.string().optional(),
  ok: z.boolean(),
  error: z.string().optional(),
})

export const employeeImportResponseSchema = z.object({
  summary: z.object({
    total: z.number().int().nonnegative(),
    imported: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  rows: z.array(employeeImportRowResultSchema),
})

// Employee Types
export type EmployeeType = z.infer<typeof employeeSchema>
export type EmployeeResponse = z.infer<typeof employeeResponseSchema>
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>
export type EmployeePaginationResponse = z.infer<
  typeof employeePaginationResponseSchema
>

// Import CSV Types
export type EmployeeImportRawRow = z.infer<typeof employeeImportRawRowSchema>
export type EmployeeImportRow = z.infer<typeof employeeImportRowSchema>
export type EmployeeImportDryRunRequest = z.infer<
  typeof employeeImportDryRunRequestSchema
>
export type EmployeeImportDryRunResponse = z.infer<
  typeof employeeImportDryRunResponseSchema
>
export type EmployeeImportRequest = z.infer<typeof employeeImportRequestSchema>
export type EmployeeImportResponse = z.infer<
  typeof employeeImportResponseSchema
>
