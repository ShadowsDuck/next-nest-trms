import {
  type OrganizationUnitResponse,
  organizationUnitResponseSchema,
} from '@workspace/schemas'
import * as z from 'zod'
import { env } from '@/lib/env'

const organizationUnitListSchema = z.array(organizationUnitResponseSchema)

export async function fetchOrganizationUnits(
  path: string
): Promise<OrganizationUnitResponse[]> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`โหลดข้อมูลหน่วยงานไม่สำเร็จ (${response.status})`)
  }

  return organizationUnitListSchema.parse(await response.json())
}

export function sortOrgUnitsByName(items: OrganizationUnitResponse[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'th'))
}
