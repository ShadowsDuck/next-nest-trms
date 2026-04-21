import { plantResponseSchema } from '@workspace/schemas'
import * as z from 'zod'
import type { OrganizationOption } from '../lib/types'
import { getOrganizationOptions } from '../lib/utils'

const plantListSchema = z.array(plantResponseSchema)

export async function getPlants(): Promise<OrganizationOption[]> {
  return await getOrganizationOptions(
    '/api/organization-units/plants',
    plantListSchema
  )
}
