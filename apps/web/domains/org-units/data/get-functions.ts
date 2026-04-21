import { orgFunctionResponseSchema } from '@workspace/schemas'
import * as z from 'zod'
import type { OrganizationOption } from '../lib/types'
import { getOrganizationOptions } from '../lib/utils'

const functionListSchema = z.array(orgFunctionResponseSchema)

export async function getFunctions(
  businessUnitId: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams({ businessUnitId })
  return await getOrganizationOptions(
    `/api/organization-units/functions?${searchParams.toString()}`,
    functionListSchema
  )
}
