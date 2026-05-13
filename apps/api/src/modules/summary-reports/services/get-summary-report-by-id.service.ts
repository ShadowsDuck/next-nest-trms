import { SummaryReportResponse } from '@workspace/schemas';
import { formatSummaryReport } from '../lib/summary-reports.mapper';
import { getSummaryReportByIdQuery } from '../queries/get-summary-report-by-id.query';

/**
 * ดึงรายงานตาม ID
 */
export async function getSummaryReportByIdService(
  userId: string,
  reportId: string,
): Promise<SummaryReportResponse> {
  const report = await getSummaryReportByIdQuery(reportId);

  if (!report || report.userId !== userId) {
    throw new Error('ไม่พบรายงานที่ต้องการ');
  }

  return formatSummaryReport(report);
}
