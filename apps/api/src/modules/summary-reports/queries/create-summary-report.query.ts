import { Prisma, SummaryReportSource } from '@workspace/database';
import { db } from '../../../lib/db';

/**
 * บันทึกรายงานสรุปใหม่ และลบรายงานเดิมถ้ามี
 */
export async function createSummaryReportQuery(
  userId: string,
  source: SummaryReportSource,
  selectedIds: string[],
  filtersSnapshot: unknown,
  reportSnapshot: unknown,
  previousReportId?: string,
  tx: Prisma.TransactionClient = db,
) {
  if (previousReportId) {
    await tx.summaryReport.delete({
      where: { id: previousReportId },
    });
  }

  return await tx.summaryReport.create({
    data: {
      userId,
      source,
      selectedIds,
      filtersSnapshot:
        filtersSnapshot === undefined
          ? Prisma.JsonNull
          : (filtersSnapshot as Prisma.InputJsonValue),
      reportSnapshot: reportSnapshot as Prisma.InputJsonValue,
    },
  });
}
