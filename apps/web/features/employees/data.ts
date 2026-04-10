import {
  type EmployeeSchemaPaginationResponse,
  type EmployeeSchemaQuery,
  employeePaginationSchema,
} from '@workspace/schemas'
import { createSerializer } from 'nuqs/server'
import { env } from '@/lib/env'
import { employeeParsers } from './lib/search-params'

const serialize = createSerializer(employeeParsers)

export async function fetchEmployees(
  params: EmployeeSchemaQuery
): Promise<EmployeeSchemaPaginationResponse> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/employees${serialize(params)}`

  const res = await fetch(url, {
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`fetchEmployees failed: ${res.status}`)

  return employeePaginationSchema.parse(await res.json())
}
