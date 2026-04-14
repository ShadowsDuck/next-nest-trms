import * as z from "zod"

// Training record schema
export const trainingRecordSchema = z.object({
  employeeId: z.string().min(1, { message: "รหัสพนักงานห้ามว่าง" }),
  courseId: z.string().min(1, { message: "รหัสหลักสูตรห้ามว่าง" }),
  createdByUserId: z.string().min(1, { message: "ผู้สร้างห้ามว่าง" }),
  updatedByUserId: z.string().min(1, { message: "ผู้แก้ไขห้ามว่าง" }),
  certFilePath: z.string().optional().nullable(),
})

// Response schema
export const trainingRecordResponseSchema = trainingRecordSchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type TrainingRecordSchemaType = z.infer<typeof trainingRecordSchema>
export type TrainingRecordSchemaResponse = z.infer<
  typeof trainingRecordResponseSchema
>
