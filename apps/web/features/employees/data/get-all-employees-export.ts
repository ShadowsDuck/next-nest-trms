import {
  type EmployeePaginationResponse,
  type EmployeeQuery,
  employeePaginationResponseSchema,
} from '@workspace/schemas'
import { env } from '@/lib/env'
import { serializeEmployeeParams } from '../lib/search-params'

export async function getAllEmployeesExport(
  params: EmployeeQuery
): Promise<EmployeePaginationResponse> {
  const baseQuery = serializeEmployeeParams(params)
  const separator = baseQuery.includes('?') ? '&' : '?'
  const url = `${env.NEXT_PUBLIC_API_URL}/api/employees${baseQuery}${separator}includeTrainingRecords=true`

  const res = await fetch(url, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Get all employees export failed: ${res.status}`)
  }

  return employeePaginationResponseSchema.parse(await res.json())
}
