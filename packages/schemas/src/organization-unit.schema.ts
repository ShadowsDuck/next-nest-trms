import * as z from "zod"

export const orgUnitLevels = [
  "Plant",
  "BU",
  "Function",
  "Division",
  "Department",
] as const

export const organizationUnitLevelSchema = z.enum(orgUnitLevels, {
  message: "ระดับหน่วยงานไม่ถูกต้อง",
})

export const organizationUnitSchema = z.object({
  name: z.string().min(1, { message: "ชื่อหน่วยงานห้ามว่าง" }),
  level: organizationUnitLevelSchema,
  parentId: z.string().min(1, { message: "รหัสหน่วยงานแม่ห้ามว่าง" }).optional(),
})

export const updateOrganizationUnitSchema = z.object({
  name: z.string().min(1, { message: "ชื่อหน่วยงานห้ามว่าง" }).optional(),
  level: organizationUnitLevelSchema.optional(),
  parentId: z
    .string()
    .min(1, { message: "รหัสหน่วยงานแม่ห้ามว่าง" })
    .nullable()
    .optional(),
})

export const organizationUnitResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: organizationUnitLevelSchema,
  parentId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const organizationUnitPathResponseSchema = z.object({
  path: z.array(organizationUnitResponseSchema),
})

export type OrganizationUnitType = z.infer<typeof organizationUnitSchema>
export type UpdateOrganizationUnitType = z.infer<typeof updateOrganizationUnitSchema>
export type OrganizationUnitResponse = z.infer<typeof organizationUnitResponseSchema>
