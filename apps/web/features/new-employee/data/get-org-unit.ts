import {
  businessUnitResponseSchema,
  departmentResponseSchema,
  divisionResponseSchema,
  orgFunctionResponseSchema,
  plantResponseSchema,
} from '@workspace/schemas'
import * as z from 'zod'
import { fetcher } from '@/lib/fetcher'

export type OrganizationOption = {
  id: string
  name: string
}

const plantListSchema = z.array(plantResponseSchema)
const businessUnitListSchema = z.array(businessUnitResponseSchema)
const functionListSchema = z.array(orgFunctionResponseSchema)
const divisionListSchema = z.array(divisionResponseSchema)
const departmentListSchema = z.array(departmentResponseSchema)

async function getOrganizationOptions<T extends OrganizationOption>(
  path: string,
  schema: z.ZodType<T[]>
): Promise<OrganizationOption[]> {
  const data = await fetcher<unknown>(path, {
    cache: 'no-store',
  })

  return schema.parse(data)
}

export async function getPlants(): Promise<OrganizationOption[]> {
  return await getOrganizationOptions(
    '/api/organization-units/plants',
    plantListSchema
  )
}

export async function getBusinessUnits(
  plantId: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams({ plantId })
  return await getOrganizationOptions(
    `/api/organization-units/business-units?${searchParams.toString()}`,
    businessUnitListSchema
  )
}

export async function getFunctions(
  businessUnitId: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams({ businessUnitId })
  return await getOrganizationOptions(
    `/api/organization-units/functions?${searchParams.toString()}`,
    functionListSchema
  )
}

export async function getDivisions(
  functionId: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams({ functionId })
  return await getOrganizationOptions(
    `/api/organization-units/divisions?${searchParams.toString()}`,
    divisionListSchema
  )
}

export async function getDepartments(
  divisionId: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams({ divisionId })
  return await getOrganizationOptions(
    `/api/organization-units/departments?${searchParams.toString()}`,
    departmentListSchema
  )
}

export function sortOrgUnitsByName<T extends OrganizationOption>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'th'))
}
