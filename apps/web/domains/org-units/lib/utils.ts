import * as z from 'zod'
import { api } from '@/shared/lib/fetcher'
import type { OrganizationOption } from './types'

export async function getOrganizationOptions<T extends OrganizationOption>(
  path: string,
  schema: z.ZodType<T[]>
): Promise<OrganizationOption[]> {
  const data = await api.get<unknown>(path, {
    cache: 'no-store',
  })

  return schema.parse(data)
}

export function sortOrgUnitsByName<T extends OrganizationOption>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'th'))
}
