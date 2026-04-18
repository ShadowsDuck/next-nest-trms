import * as z from "zod"
import { toArray } from "./lib/zod-helper"
import { trainingRecordResponseSchema } from "./training-record.schema"

export const prefix = ["Mr", "Mrs", "Miss"] as const
export const jobLevel = ["S1", "S2", "M1", "M2"] as const
export const employeeStatus = ["Active", "Resigned"] as const

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
  plantId: z.string().min(1, { message: "Plant ห้ามว่าง" }),
  buId: z.string().min(1, { message: "Business Unit ห้ามว่าง" }),
  functionId: z.string().min(1, { message: "Function ห้ามว่าง" }),
  divisionId: z.string().min(1, { message: "Division ห้ามว่าง" }),
  departmentId: z.string().min(1, { message: "Department ห้ามว่าง" }),
})

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

export const employeePaginationResponseSchema = z.object({
  data: z.array(employeeResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(25),
  search: z.string().optional(),
  prefix: z.pipe(toArray, z.array(z.enum(prefix))).optional(),
  jobLevel: z.pipe(toArray, z.array(z.enum(jobLevel))).optional(),
  status: z.pipe(toArray, z.array(z.enum(employeeStatus))).optional(),
  includeTrainingRecords: z.coerce.boolean().optional(),
})

export type EmployeeType = z.infer<typeof employeeSchema>
export type EmployeeResponse = z.infer<typeof employeeResponseSchema>
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>
export type EmployeePaginationResponse = z.infer<
  typeof employeePaginationResponseSchema
>
