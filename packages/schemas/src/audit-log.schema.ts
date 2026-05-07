import * as z from "zod"
import { toArray } from "./lib/zod-helper"

export const auditAction = [
  "Create",
  "Update",
  "Delete",
  "Import",
  "Export",
  "Failed",
] as const

export const auditLogUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

export const auditLogSchema = z.object({
  id: z.string(),
  action: z.enum(auditAction, { message: "ประเภทกิจกรรมไม่ถูกต้อง" }),
  model: z.string().min(1, { message: "ชื่อโมเดลห้ามว่าง" }),
  recordId: z.string().nullable().optional(),
  oldValues: z.unknown().nullable().optional(),
  newValues: z.unknown().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  timestamp: z.iso.datetime(),
  userId: z.string(),
  user: auditLogUserSchema,
})

export const auditLogPaginationResponseSchema = z.object({
  data: z.array(auditLogSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1).default(1),
  limit: z.coerce.number().int().positive().max(100).catch(25).default(25),
  search: z.string().optional(),
  model: z.pipe(toArray, z.array(z.string().min(1))).optional(),
  action: z.pipe(toArray, z.array(z.enum(auditAction))).optional(),
  dateRange: z
    .pipe(toArray, z.array(z.coerce.number().int().nonnegative()).length(2))
    .optional(),
})

export type AuditAction = z.infer<typeof auditLogSchema>["action"]
export type AuditLogUser = z.infer<typeof auditLogUserSchema>
export type AuditLog = z.infer<typeof auditLogSchema>
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>
export type AuditLogPaginationResponse = z.infer<
  typeof auditLogPaginationResponseSchema
>
