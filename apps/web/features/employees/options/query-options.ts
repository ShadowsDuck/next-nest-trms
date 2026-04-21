import type { EmployeeQuery } from '@workspace/schemas'

export const EMPLOYEES_QUERY_KEY = 'employees'
export const EMPLOYEE_FILTER_OPTIONS_QUERY_KEY = [
  'employee-filter-options',
] as const

export function buildEmployeesQueryKey(params: EmployeeQuery) {
  const prefix = params.prefix ?? []
  const jobLevel = params.jobLevel ?? []
  const divisionName = params.divisionName ?? []
  const departmentName = params.departmentName ?? []
  const status = params.status ?? []

  return [
    EMPLOYEES_QUERY_KEY,
    params.page,
    params.limit,
    params.search,
    prefix.join(','),
    jobLevel.join(','),
    divisionName.join(','),
    departmentName.join(','),
    status.join(','),
  ] as const
}
