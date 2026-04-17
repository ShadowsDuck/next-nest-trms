import {
  type EmployeePaginationResponse,
  type EmployeeQuery,
  employeePaginationResponseSchema,
} from '@workspace/schemas'
import { fetcher } from '@/lib/fetcher'
import { serializeEmployeeParams } from '../lib/search-params'

export async function getAllEmployeesExport(
  params: EmployeeQuery
): Promise<EmployeePaginationResponse> {
  const baseQuery = serializeEmployeeParams(params)
  const separator = baseQuery.includes('?') ? '&' : '?'
  const endpoint = `/api/employees${baseQuery}${separator}includeTrainingRecords=true`

  const data = await fetcher<EmployeePaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return employeePaginationResponseSchema.parse(data)
}
