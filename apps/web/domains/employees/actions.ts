'use server'

import {
  type EmployeeImportDryRunRequest,
  type EmployeeImportDryRunResponse,
  type EmployeeImportRequest,
  type EmployeeImportResponse,
  type EmployeeResponse,
  type EmployeeType,
  employeeImportDryRunResponseSchema,
  employeeImportResponseSchema,
  employeeResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'

export async function createEmployee(
  payload: EmployeeType
): Promise<EmployeeResponse> {
  const data = await api.post<EmployeeResponse>('/api/employees', payload)

  return employeeResponseSchema.parse(data)
}

export async function dryRunImportEmployees(
  payload: EmployeeImportDryRunRequest
): Promise<EmployeeImportDryRunResponse> {
  const data = await api.post<EmployeeImportDryRunResponse>(
    '/api/employees/import/dry-run',
    payload
  )

  return employeeImportDryRunResponseSchema.parse(data)
}

export async function importEmployees(
  payload: EmployeeImportRequest
): Promise<EmployeeImportResponse> {
  const data = await api.post<EmployeeImportResponse>(
    '/api/employees/import',
    payload
  )

  return employeeImportResponseSchema.parse(data)
}
