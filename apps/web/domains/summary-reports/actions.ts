'use server'

import { revalidateTag } from 'next/cache'
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
  await api.delete(`/api/summary-reports/${reportId}`)
  revalidateTag('summary-reports', 'max')
}
