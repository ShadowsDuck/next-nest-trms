import {
  type EmployeePaginationResponse,
  type EmployeeQuery,
  employeePaginationResponseSchema,
} from '@workspace/schemas'
import { env } from '@/lib/env'
import { serializeEmployeeParams } from '../lib/search-params'

export async function getAllEmployees(
  params: EmployeeQuery
): Promise<EmployeePaginationResponse> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/employees${serializeEmployeeParams(params)}`

  const res = await fetch(url, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Get all employees failed: ${res.status}`)
  }

  return employeePaginationResponseSchema.parse(await res.json())
}
