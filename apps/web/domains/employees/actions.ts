'use server'

import {
  type EmployeeResponse,
  type EmployeeType,
  employeeResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'

export async function createEmployee(
  payload: EmployeeType
): Promise<EmployeeResponse> {
  const data = await api.post<EmployeeResponse>('/api/employees', payload)

  return employeeResponseSchema.parse(data)
}
