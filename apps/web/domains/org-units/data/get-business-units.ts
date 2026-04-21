import { businessUnitResponseSchema } from '@workspace/schemas'
import * as z from 'zod'
import type { OrganizationOption } from '../lib/types'
import { getOrganizationOptions } from '../lib/utils'

const businessUnitListSchema = z.array(businessUnitResponseSchema)

export async function getBusinessUnits(
  plantId: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams({ plantId })
  return await getOrganizationOptions(
    `/api/organization-units/business-units?${searchParams.toString()}`,
    businessUnitListSchema
  )
}
