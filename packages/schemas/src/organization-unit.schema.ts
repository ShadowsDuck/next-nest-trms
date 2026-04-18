import * as z from "zod"

const requiredName = z.string().min(1, { message: "ชื่อหน่วยงานห้ามว่าง" })
const requiredId = z.string().min(1, { message: "รหัสหน่วยงานห้ามว่าง" })

const organizationResourceResponseBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const plantSchema = z.object({
  name: requiredName,
})

export const updatePlantSchema = plantSchema.partial()

export const plantResponseSchema = organizationResourceResponseBaseSchema

export const businessUnitSchema = z.object({
  name: requiredName,
  plantId: requiredId,
})

export const updateBusinessUnitSchema = z.object({
  name: requiredName.optional(),
  plantId: requiredId.optional(),
})

export const businessUnitQuerySchema = z.object({
  plantId: requiredId.optional(),
})

export const businessUnitResponseSchema =
  organizationResourceResponseBaseSchema.extend({
    plantId: z.string(),
  })

export const orgFunctionSchema = z.object({
  name: requiredName,
  businessUnitId: requiredId,
})

export const updateOrgFunctionSchema = z.object({
  name: requiredName.optional(),
  businessUnitId: requiredId.optional(),
})

export const orgFunctionQuerySchema = z.object({
  businessUnitId: requiredId.optional(),
})

export const orgFunctionResponseSchema =
  organizationResourceResponseBaseSchema.extend({
    businessUnitId: z.string(),
  })

export const divisionSchema = z.object({
  name: requiredName,
  functionId: requiredId,
})

export const updateDivisionSchema = z.object({
  name: requiredName.optional(),
  functionId: requiredId.optional(),
})

export const divisionQuerySchema = z.object({
  functionId: requiredId.optional(),
})

export const divisionResponseSchema =
  organizationResourceResponseBaseSchema.extend({
    functionId: z.string(),
  })

export const departmentSchema = z.object({
  name: requiredName,
  divisionId: requiredId,
})

export const updateDepartmentSchema = z.object({
  name: requiredName.optional(),
  divisionId: requiredId.optional(),
})

export const departmentQuerySchema = z.object({
  divisionId: requiredId.optional(),
})

export const departmentResponseSchema =
  organizationResourceResponseBaseSchema.extend({
    divisionId: z.string(),
  })

export type PlantType = z.infer<typeof plantSchema>
export type UpdatePlantType = z.infer<typeof updatePlantSchema>
export type PlantResponse = z.infer<typeof plantResponseSchema>

export type BusinessUnitType = z.infer<typeof businessUnitSchema>
export type UpdateBusinessUnitType = z.infer<typeof updateBusinessUnitSchema>
export type BusinessUnitQuery = z.infer<typeof businessUnitQuerySchema>
export type BusinessUnitResponse = z.infer<typeof businessUnitResponseSchema>

export type OrgFunctionType = z.infer<typeof orgFunctionSchema>
export type UpdateOrgFunctionType = z.infer<typeof updateOrgFunctionSchema>
export type OrgFunctionQuery = z.infer<typeof orgFunctionQuerySchema>
export type OrgFunctionResponse = z.infer<typeof orgFunctionResponseSchema>

export type DivisionType = z.infer<typeof divisionSchema>
export type UpdateDivisionType = z.infer<typeof updateDivisionSchema>
export type DivisionQuery = z.infer<typeof divisionQuerySchema>
export type DivisionResponse = z.infer<typeof divisionResponseSchema>

export type DepartmentType = z.infer<typeof departmentSchema>
export type UpdateDepartmentType = z.infer<typeof updateDepartmentSchema>
export type DepartmentQuery = z.infer<typeof departmentQuerySchema>
export type DepartmentResponse = z.infer<typeof departmentResponseSchema>
