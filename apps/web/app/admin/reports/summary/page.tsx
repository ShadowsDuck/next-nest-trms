import { SummaryReportPage } from '@/features/summary-report/components/summary-report-page'
import {
  getLatestSummaryReport,
  getSummaryReportById,
} from '@/features/summary-report/data/get-summary-report'

export default async function AdminSummaryReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ reportId?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const reportId = Array.isArray(resolvedSearchParams?.reportId)
    ? resolvedSearchParams?.reportId[0]
    : resolvedSearchParams?.reportId

  const report = reportId
    ? await getSummaryReportById(reportId)
    : await getLatestSummaryReport()

  return <SummaryReportPage initialReport={report} />
}
