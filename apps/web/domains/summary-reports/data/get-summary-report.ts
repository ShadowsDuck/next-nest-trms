import { headers } from 'next/headers'
import {
  type SummaryReportResponse,
  summaryReportResponseSchema,
} from '@workspace/schemas'
import { env } from '@/shared/lib/env'
import { requireAdmin } from '@/shared/lib/session'

async function safeFetchSummaryReport(
  endpoint: string
): Promise<SummaryReportResponse | null> {
  await requireAdmin()

  const cookieHeader = (await headers()).get('cookie')
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
    {
      cache: 'force-cache',
      next: { tags: ['summary-reports'] },
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      credentials: 'same-origin',
    }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  const data = (await response.json()) as SummaryReportResponse
  return summaryReportResponseSchema.parse(data)
}

export async function getSummaryReportById(reportId: string) {
  return safeFetchSummaryReport(`/api/summary-reports/${reportId}`)
}

export async function getLatestSummaryReport() {
  return safeFetchSummaryReport('/api/summary-reports/latest')
}
