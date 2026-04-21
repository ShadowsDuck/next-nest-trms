import {
  type EmployeePaginationResponse,
  type EmployeeQuery,
  employeePaginationResponseSchema,
} from '@workspace/schemas'
import { fetcher } from '@/shared/lib/fetcher'
import { serializeEmployeeParams } from '../lib/search-params'

export async function getAllEmployees(
  params: EmployeeQuery
): Promise<EmployeePaginationResponse> {
  const endpoint = `/api/employees${serializeEmployeeParams(params)}`

  const data = await fetcher<EmployeePaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return employeePaginationResponseSchema.parse(data)
}
