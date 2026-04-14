import * as z from "zod"
import { toArray } from "./lib/zod-helper"

export const courseType = ["Internal", "External"] as const
export const accreditationStatus = ["Pending", "Approved", "Rejected"] as const

// Course schema
export const courseSchema = z.object({
  title: z.string().min(1, { message: "ชื่อหลักสูตรห้ามว่าง" }),
  type: z.enum(courseType, { message: "ประเภทหลักสูตรไม่ถูกต้อง" }),
  startDate: z.iso.date({ message: "วันที่เริ่มต้นไม่ถูกต้อง" }),
  endDate: z.iso.date({ message: "วันที่สิ้นสุดไม่ถูกต้อง" }),
  startTime: z.iso.time().optional().nullable(),
  endTime: z.iso.time().optional().nullable(),
  duration: z.coerce
    .number()
    .nonnegative({ message: "ระยะเวลาหลักสูตรต้องมากกว่าหรือเท่ากับ 0" }),
  lecturer: z.string().optional().nullable(),
  institute: z.string().optional().nullable(),
  expense: z.coerce
    .number()
    .nonnegative({ message: "ค่าใช้จ่ายต้องมากกว่าหรือเท่ากับ 0" })
    .default(0),
  accreditationStatus: z.enum(accreditationStatus, {
    message: "สถานะการรับรองไม่ถูกต้อง",
  }),
  accreditationFilePath: z.string().optional().nullable(),
  attendanceFilePath: z.string().optional().nullable(),
  tagId: z.string().min(1, { message: "หมวดหมู่หลักสูตรห้ามว่าง" }),
})

// Response schema
export const courseResponseSchema = courseSchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

// Response paginated courses schema
export const coursePaginationResponseSchema = z.object({
  data: z.array(courseResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

// Query schema for filtering courses
export const courseQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(100).catch(25),
  search: z.string().optional(), // title, lecturer, institute
  type: z.pipe(toArray, z.array(z.enum(courseType))).optional(),
  accreditationStatus: z
    .pipe(toArray, z.array(z.enum(accreditationStatus)))
    .optional(),
  tagId: z.pipe(toArray, z.array(z.string().min(1))).optional(),
})

export type CourseType = z.infer<typeof courseSchema>
export type CourseResponse = z.infer<typeof courseResponseSchema>
export type CourseQuery = z.infer<typeof courseQuerySchema>
export type CoursePaginationResponse = z.infer<
  typeof coursePaginationResponseSchema
>
