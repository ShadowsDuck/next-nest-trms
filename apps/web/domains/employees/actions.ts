'use server'

import {
  type EmployeeResponse,
  type EmployeeType,
  employeeResponseSchema,
} from '@workspace/schemas'
import { fetcher } from '@/shared/lib/fetcher'

export async function createEmployee(
  payload: EmployeeType
): Promise<EmployeeResponse> {
  const data = await fetcher<EmployeeResponse>('/api/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return employeeResponseSchema.parse(data)
}
