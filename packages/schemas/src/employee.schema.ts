import * as z from "zod"
import { toArray } from "./lib/zod-helper"

const PrefixEnum = z.enum(["MR", "MRS", "MISS"])
const JobLevelEnum = z.enum(["S1", "S2", "M1", "M2"])
const EmployeeStatusEnum = z.enum(["ACTIVE", "RESIGNED"])

// Base employee schema
export const EmployeeSchema = z.object({
  id: z.cuid(),
  // org_unit_id: z.cuid(),
  employee_no: z.string().min(1, "รหัสพนักงานห้ามว่าง"),
  prefix: PrefixEnum,
  first_name: z.string().min(1, "ชื่อห้ามว่าง"),
  last_name: z.string().min(1, "นามสกุลห้ามว่าง"),
  id_card_no: z
    .string()
    .length(13, "เลขบัตรประชาชนต้องมี 13 หลัก")
    .regex(/^\d{13}$/, "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น")
    .nullable()
    .optional(),
  hire_date: z.iso.date().nullable().optional(),
  job_level: JobLevelEnum,
  status: EmployeeStatusEnum.default("ACTIVE"),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Employee = z.infer<typeof EmployeeSchema>

// Create employee schema
export const CreateEmployeeSchema = EmployeeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).meta({
  example: {
    employee_no: "EMP001",
    prefix: "MR",
    first_name: "สมชาย",
    last_name: "สายลม",
    id_card_no: "1234567890123",
    hire_date: "2026-03-23",
    job_level: "S1",
    status: "ACTIVE",
  },
})

export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>

// Update employee schema
export const UpdateEmployeeSchema = CreateEmployeeSchema.partial()

export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>

// Response paginated employees schema
export const EmployeePaginationSchema = z.object({
  data: z.array(EmployeeSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

export type EmployeePagination = z.infer<typeof EmployeePaginationSchema>

// Query params schema for filtering employees
export const EmployeeQueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(10),
  search: z.string().optional(), // employee_no, first_name, last_name, id_card_no
  prefix: z.pipe(toArray, z.array(PrefixEnum)).optional(),
  job_level: z.pipe(toArray, z.array(JobLevelEnum)).optional(),
  status: z.pipe(toArray, z.array(EmployeeStatusEnum)).optional(),
})

export type EmployeeQuery = z.infer<typeof EmployeeQueryParamsSchema>
