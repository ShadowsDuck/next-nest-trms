import { db } from '../../../lib/db';

/**
 * ดึงรายงานตาม ID
 */
export async function getSummaryReportByIdQuery(id: string) {
  return await db.summaryReport.findUnique({
    where: { id },
  });
}
