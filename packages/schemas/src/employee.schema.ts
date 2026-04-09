import * as z from "zod"
import { toArray } from "./lib/zod-helper"

export const prefix = ["Mr", "Mrs", "Miss"] as const
export const jobLevel = ["S1", "S2", "M1", "M2"] as const
export const employeeStatus = ["Active", "Resigned"] as const

// Employee schema
export const employeeSchema = z.object({
  employeeNo: z.string().min(1, { message: "รหัสพนักงานห้ามว่าง" }),
  prefix: z.enum(prefix, { message: "คำนำหน้าไม่ถูกต้อง" }),
  firstName: z.string().min(1, { message: "ชื่อห้ามว่าง" }),
  lastName: z.string().min(1, { message: "นามสกุลห้ามว่าง" }),
  idCardNo: z
    .string()
    .length(13, { message: "เลขบัตรประชาชนต้องมี 13 หลัก" })
    .regex(/^\d{13}$/, { message: "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น" })
    .optional(),
  hireDate: z.iso.date().optional(),
  jobLevel: z.enum(jobLevel, { message: "ระดับตำแหน่งไม่ถูกต้อง" }),
  status: z.enum(employeeStatus, { message: "สถานะไม่ถูกต้อง" }),
})

// Response schema
export const employeeResponseSchema = employeeSchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

// Response paginated employees schema
export const employeePaginationSchema = z.object({
  data: z.array(employeeResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

// Query schema for filtering employees
export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(10),
  search: z.string().optional(), // employeeNo, firstName, lastName, idCardNo
  prefix: z.pipe(toArray, z.array(z.enum(prefix))).optional(),
  jobLevel: z.pipe(toArray, z.array(z.enum(jobLevel))).optional(),
  status: z.pipe(toArray, z.array(z.enum(employeeStatus))).optional(),
})

export type EmployeeSchemaType = z.infer<typeof employeeSchema>
export type EmployeeSchemaResponse = z.infer<typeof employeeResponseSchema>
export type EmployeeSchemaQuery = z.infer<typeof employeeQuerySchema>
export type EmployeeSchemaPaginationResponse = z.infer<
  typeof employeePaginationSchema
>
