'use client'

import { useQuery } from '@tanstack/react-query'
import {
  type OrganizationOption,
  getDepartments,
  getDivisions,
  sortOrgUnitsByName,
} from '@/domains/org-units'
import type { Option } from '@/shared/components/niko-table/types'
import { EMPLOYEE_FILTER_OPTIONS_QUERY_KEY } from '../options/query-options'

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

export function useEmployeeFilterOptions() {
  return useQuery({
    queryKey: EMPLOYEE_FILTER_OPTIONS_QUERY_KEY,
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
