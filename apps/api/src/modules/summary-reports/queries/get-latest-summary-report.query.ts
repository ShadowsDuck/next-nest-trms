import { db } from '../../../lib/db';

/**
 * ดึงรายงานล่าสุดของผู้ใช้
 */
export async function getLatestSummaryReportByUserIdQuery(userId: string) {
  return await db.summaryReport.findUnique({
    where: { userId },
  });
}
