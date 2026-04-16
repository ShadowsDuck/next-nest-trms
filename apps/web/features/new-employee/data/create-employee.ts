import {
  type EmployeeResponse,
  type EmployeeType,
  employeeResponseSchema,
} from '@workspace/schemas'
import { env } from '@/lib/env'

export async function createEmployee(
  payload: EmployeeType
): Promise<EmployeeResponse> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = `สร้างพนักงานไม่สำเร็จ (${response.status})`

    try {
      const errorBody = (await response.json()) as {
        message?: string | string[]
      }
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(', ')
      } else if (errorBody.message) {
        message = errorBody.message
      }
    } catch {
      // ใช้ข้อความ fallback เมื่อ response ไม่ใช่ JSON
    }

    throw new Error(message)
  }

  return employeeResponseSchema.parse(await response.json())
}
