'use server'

import {
  type CourseQuery,
  type CreateSummaryReportResponse,
  type EmployeeQuery,
  createSummaryReportResponseSchema,
} from '@workspace/schemas'
import { fetcher } from '@/shared/lib/fetcher'

export async function createEmployeeSummaryReport({
  params,
  selectedEmployeeNos,
}: {
  params: EmployeeQuery
  selectedEmployeeNos: string[]
}): Promise<CreateSummaryReportResponse> {
  const data = await fetcher<CreateSummaryReportResponse>(
    '/api/summary-reports',
    {
      method: 'POST',
      body: JSON.stringify({
        source: 'employees',
        selectedIds: selectedEmployeeNos,
        filtersSnapshot: params,
      }),
    }
  )

  return createSummaryReportResponseSchema.parse(data)
}

export async function createCourseSummaryReport({
  params,
  selectedCourseIds,
}: {
  params: CourseQuery
  selectedCourseIds: string[]
}): Promise<CreateSummaryReportResponse> {
  const data = await fetcher<CreateSummaryReportResponse>(
    '/api/summary-reports',
    {
      method: 'POST',
      body: JSON.stringify({
        source: 'courses',
        selectedIds: selectedCourseIds,
        filtersSnapshot: params,
      }),
    }
  )

  return createSummaryReportResponseSchema.parse(data)
}

export async function deleteSummaryReport(reportId: string) {
  await fetcher(`/api/summary-reports/${reportId}`, {
    method: 'DELETE',
  })
}
