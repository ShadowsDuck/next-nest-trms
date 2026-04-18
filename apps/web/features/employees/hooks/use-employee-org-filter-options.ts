'use client'

import { useQuery } from '@tanstack/react-query'
import type { Option } from '@/components/niko-table/types'
import {
  type OrganizationOption,
  getDepartments,
  getDivisions,
  sortOrgUnitsByName,
} from '@/features/new-employee/data/get-org-unit'

function toUniqueOptions(items: OrganizationOption[]): Option[] {
  const seen = new Set<string>()

  return sortOrgUnitsByName(items).flatMap((item) => {
    if (seen.has(item.name)) {
      return []
    }

    seen.add(item.name)
    return [{ label: item.name, value: item.name }]
  })
}

export function useEmployeeOrgFilterOptions() {
  return useQuery({
    queryKey: ['employee-org-filter-options'],
    queryFn: async () => {
      const [divisions, departments] = await Promise.all([
        getDivisions(),
        getDepartments(),
      ])

      return {
        divisionOptions: toUniqueOptions(divisions),
        departmentOptions: toUniqueOptions(departments),
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
