import * as z from "zod"
import { courseResponseSchema } from "./course.schema"

// Training record schema
export const trainingRecordSchema = z.object({
  employeeId: z.string().min(1, { message: "รหัสพนักงานห้ามว่าง" }),
  courseId: z.string().min(1, { message: "รหัสหลักสูตรห้ามว่าง" }),
  certFilePath: z.string().optional().nullable(),
  createdByUserId: z.string().min(1, { message: "ผู้สร้างห้ามว่าง" }),
  updatedByUserId: z.string().min(1, { message: "ผู้แก้ไขห้ามว่าง" }),
})

// Response schema
export const trainingRecordResponseSchema = trainingRecordSchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  course: courseResponseSchema.optional(),
})

export type TrainingRecordType = z.infer<typeof trainingRecordSchema>
export type TrainingRecordResponse = z.infer<
  typeof trainingRecordResponseSchema
>
