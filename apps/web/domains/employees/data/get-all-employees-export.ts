import {
  type EmployeePaginationResponse,
  type EmployeeQuery,
  employeePaginationResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'
import { serializeEmployeeParams } from '../lib/search-params'

export async function getAllEmployeesExport(
  params: EmployeeQuery,
  options?: { includeTrainingRecords?: boolean }
): Promise<EmployeePaginationResponse> {
  const baseQuery = serializeEmployeeParams(params)
  const separator = baseQuery.includes('?') ? '&' : '?'
  const endpoint = options?.includeTrainingRecords
    ? `/api/employees${baseQuery}${separator}includeTrainingRecords=true`
    : `/api/employees${baseQuery}`

  const data = await api.get<EmployeePaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return employeePaginationResponseSchema.parse(data)
}
