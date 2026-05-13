import { SummaryReportSource } from '@workspace/database';
import {
  SummaryReportResponse,
  SummaryReportSnapshot,
  summaryReportResponseSchema,
} from '@workspace/schemas';
import { toIsoDateTime } from '../../../utils/date-utils';

/**
 * จัดรูปแบบข้อมูลรายงานเพื่อส่งออกไปยัง API Response
 */
export function formatSummaryReport(report: {
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
