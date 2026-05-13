import { SummaryReportResponse } from '@workspace/schemas';
import { formatSummaryReport } from '../lib/summary-reports.mapper';
import { getLatestSummaryReportByUserIdQuery } from '../queries/get-latest-summary-report.query';

/**
 * ดึงรายงานล่าสุดของผู้ใช้ปัจจุบัน
 */
export async function getLatestSummaryReportService(
  userId: string,
): Promise<SummaryReportResponse> {
  const report = await getLatestSummaryReportByUserIdQuery(userId);

  if (!report) {
    throw new Error('ไม่พบรายงานล่าสุด');
  }

  return formatSummaryReport(report);
}
