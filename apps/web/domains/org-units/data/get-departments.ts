import { departmentResponseSchema } from '@workspace/schemas'
import * as z from 'zod'
import type { OrganizationOption } from '../lib/types'
import { getOrganizationOptions } from '../lib/utils'

const departmentListSchema = z.array(departmentResponseSchema)

export async function getDepartments(
  divisionId?: string
): Promise<OrganizationOption[]> {
  const searchParams = new URLSearchParams()

  if (divisionId) {
    searchParams.set('divisionId', divisionId)
  }

  return await getOrganizationOptions(
    searchParams.size > 0
      ? `/api/organization-units/departments?${searchParams.toString()}`
      : '/api/organization-units/departments',
    departmentListSchema
  )
}
