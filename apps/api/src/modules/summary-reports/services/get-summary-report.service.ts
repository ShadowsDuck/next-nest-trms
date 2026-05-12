import { SummaryReportSource } from '@workspace/database';
import {
  SummaryReportResponse,
  SummaryReportSnapshot,
  summaryReportResponseSchema,
} from '@workspace/schemas';
import { toIsoDateTime } from '../../../utils/date-utils';
import { getLatestSummaryReportByUserIdQuery } from '../queries/get-latest-summary-report.query';
import { getSummaryReportByIdQuery } from '../queries/get-summary-report-by-id.query';

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

  return toResponse(report);
}

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

  return toResponse(report);
}

/**
 * จัดรูปแบบ Response
 */
function toResponse(report: {
  id: string;
  source: SummaryReportSource;
  selectedIds: unknown;
  filtersSnapshot: unknown;
  reportSnapshot: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SummaryReportResponse {
  const snapshot = report.reportSnapshot as SummaryReportSnapshot;

  return summaryReportResponseSchema.parse({
    id: report.id,
    source: report.source,
    generatedAt: snapshot.generatedAt,
    selectedIds: report.selectedIds,
    filtersSnapshot: report.filtersSnapshot,
    reportSnapshot: snapshot,
    createdAt: toIsoDateTime(report.createdAt),
    updatedAt: toIsoDateTime(report.updatedAt),
  });
}
