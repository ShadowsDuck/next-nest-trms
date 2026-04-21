import { divisionResponseSchema } from '@workspace/schemas'
import * as z from 'zod'
import type { OrganizationOption } from '../lib/types'
import { getOrganizationOptions } from '../lib/utils'

const divisionListSchema = z.array(divisionResponseSchema)

export async function getDivisions(
  functionId?: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams()

  if (functionId) {
    searchParams.set('functionId', functionId)
  }

  return await getOrganizationOptions(
    searchParams.size > 0
      ? `/api/organization-units/divisions?${searchParams.toString()}`
      : '/api/organization-units/divisions',
    divisionListSchema
  )
}
