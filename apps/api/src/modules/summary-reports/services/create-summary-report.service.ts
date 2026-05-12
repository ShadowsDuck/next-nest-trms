import { AuditAction, SummaryReportSource } from '@workspace/database';
import {
  CreateSummaryReport,
  CreateSummaryReportResponse,
  SummaryReportSnapshot,
} from '@workspace/schemas';
import { db } from '../../../lib/db';
import type { AuditLogContext } from '../../audit-logs/audit-logs.types';
import {
  createAuditLog,
  createFailureLog,
} from '../../audit-logs/services/audit-logs-write.service';
import { createSummaryReportQuery } from '../queries/create-summary-report.query';
import { getLatestSummaryReportByUserIdQuery } from '../queries/get-latest-summary-report.query';
import {
  buildSummaryReportSnapshot,
  sourceAdapters,
} from '../summary-report-source.adapter';

/**
 * สร้างรายงานสรุปสำหรับผู้ใช้งาน
 */
export async function createSummaryReportService(
  userId: string,
  dto: CreateSummaryReport,
  auditLogContext: AuditLogContext,
): Promise<CreateSummaryReportResponse> {
  try {
    if (dto.selectedIds.length === 0) {
      throw new Error('กรุณาเลือกรายการก่อนสร้างรายงาน');
    }

    const previousReport = await getLatestSummaryReportByUserIdQuery(userId);
    const reportSnapshot = await _buildSnapshot(dto);

    const report = await db.$transaction(async (tx) => {
      if (previousReport) {
        await createAuditLog(
          {
            action: AuditAction.Delete,
            model: 'SummaryReport',
            recordId: previousReport.id,
            oldValues: previousReport,
            context: auditLogContext,
          },
          tx,
        );
      }

      const createdReport = await createSummaryReportQuery(
        userId,
        dto.source === 'employees'
          ? SummaryReportSource.employees
          : SummaryReportSource.courses,
        dto.selectedIds,
        dto.filtersSnapshot,
        reportSnapshot,
        previousReport?.id,
        tx,
      );

      await createAuditLog(
        {
          action: AuditAction.Create,
          model: 'SummaryReport',
          recordId: createdReport.id,
          newValues: createdReport,
          context: auditLogContext,
        },
        tx,
      );

      return createdReport;
    });

    return {
      reportId: report.id,
    };
  } catch (error) {
    await createFailureLog({
      model: 'SummaryReport',
      newValues: {
        source: dto.source,
        selectedIds: dto.selectedIds,
        filtersSnapshot: dto.filtersSnapshot,
        error: toAuditErrorPayload(error),
      },
      context: auditLogContext,
    });
    throw error;
  }
}

async function _buildSnapshot(
  dto: CreateSummaryReport,
): Promise<SummaryReportSnapshot> {
  return buildSummaryReportSnapshot(
    sourceAdapters,
    dto,
    new Date().toISOString(),
  );
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
