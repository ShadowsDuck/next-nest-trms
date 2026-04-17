import {
  type OrganizationUnitResponse,
  organizationUnitResponseSchema,
} from '@workspace/schemas'
import * as z from 'zod'
import { fetcher } from '@/lib/fetcher'

const organizationUnitListSchema = z.array(organizationUnitResponseSchema)

export async function getOrganizationUnits(
  path: string
): Promise<OrganizationUnitResponse[]> {
  const data = await fetcher<OrganizationUnitResponse[]>(path, {
    cache: 'no-store',
  })

  return organizationUnitListSchema.parse(data)
}

export function sortOrgUnitsByName(items: OrganizationUnitResponse[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'th'))
}
