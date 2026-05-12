import { AuditAction, SummaryReportSource } from '@workspace/database';
import { db } from '../../../lib/db';
import type { AuditLogContext } from '../../audit-logs/audit-logs.types';
import {
  createAuditLog,
  createFailureLog,
} from '../../audit-logs/services/audit-logs-write.service';
import { deleteSummaryReportByIdQuery } from '../queries/delete-summary-report.query';
import { getSummaryReportByIdQuery } from '../queries/get-summary-report-by-id.query';

/**
 * ลบรายงานสรุปตาม ID
 */
export async function deleteSummaryReportService(
  userId: string,
  reportId: string,
  auditLogContext: AuditLogContext,
): Promise<void> {
  try {
    const report = await getSummaryReportByIdQuery(reportId);

    if (!report || report.userId !== userId) {
      throw new Error('ไม่พบรายงานที่ต้องการ');
    }

    await db.$transaction(async (tx) => {
      await deleteSummaryReportByIdQuery(reportId, tx);

      await createAuditLog(
        {
          action: AuditAction.Delete,
          model: 'SummaryReport',
          recordId: report.id,
          oldValues: report,
          context: auditLogContext,
        },
        tx,
      );
    });
  } catch (error) {
    await createFailureLog({
      model: 'SummaryReport',
      recordId: reportId,
      newValues: {
        error: toAuditErrorPayload(error),
      },
      context: auditLogContext,
    });
    throw error;
  }
}

function toAuditErrorPayload(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: 'UnknownError',
    message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
  };
}
