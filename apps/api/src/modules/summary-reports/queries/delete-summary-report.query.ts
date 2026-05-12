import { Prisma } from '@workspace/database';
import { db } from '../../../lib/db';

/**
 * ลบรายงานตาม ID
 */
export async function deleteSummaryReportByIdQuery(
  id: string,
  tx: Prisma.TransactionClient = db,
) {
  return await tx.summaryReport.delete({
    where: { id },
  });
}
