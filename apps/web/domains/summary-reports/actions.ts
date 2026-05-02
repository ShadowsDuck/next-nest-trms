'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import {
  type CourseQuery,
  type CreateSummaryReportResponse,
  type EmployeeQuery,
  createSummaryReportResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'

export async function createEmployeeSummaryReport({
  params,
  selectedEmployeeNos,
}: {
  params: EmployeeQuery
  selectedEmployeeNos: string[]
}): Promise<CreateSummaryReportResponse> {
  const data = await api.post<CreateSummaryReportResponse>(
    '/api/summary-reports',
    {
      source: 'employees',
      selectedIds: selectedEmployeeNos,
      filtersSnapshot: params,
    }
  )

  revalidateTag('summary-reports', 'max')
  return createSummaryReportResponseSchema.parse(data)
}

export async function createCourseSummaryReport({
  params,
  selectedCourseIds,
}: {
  params: CourseQuery
  selectedCourseIds: string[]
}): Promise<CreateSummaryReportResponse> {
  const data = await api.post<CreateSummaryReportResponse>(
    '/api/summary-reports',
    {
      source: 'courses',
      selectedIds: selectedCourseIds,
      filtersSnapshot: params,
    }
  )

  revalidateTag('summary-reports', 'max')
  return createSummaryReportResponseSchema.parse(data)
}

export async function deleteSummaryReport(reportId: string) {
  try {
    await api.delete(`/api/summary-reports/${reportId}`)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('ไม่พบรายงานที่ต้องการ')
    ) {
      // รายงานถูกลบไปแล้วจากคำขอก่อนหน้า ให้ถือว่าสำเร็จแบบ idempotent
    } else {
      throw error
    }
  }

  revalidateTag('summary-reports', 'max')
  revalidatePath('/admin/reports/summary')
}
