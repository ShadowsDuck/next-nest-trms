import {
  type EmployeeDetailResponse,
  employeeDetailResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'

// ดึงรายละเอียดพนักงาน 1 รายการตาม employeeNo พร้อมประวัติการอบรมจาก API
export async function getEmployeeDetail(
  employeeNo: string
): Promise<EmployeeDetailResponse> {
  const endpoint = `/api/employees/${encodeURIComponent(employeeNo)}`

  const data = await api.get<EmployeeDetailResponse>(endpoint, {
    cache: 'no-store',
  })

  return employeeDetailResponseSchema.parse(data)
}
