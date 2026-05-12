import { AuditAction, SummaryReportSource } from '@workspace/database';
import {
  CreateSummaryReport,
  CreateSummaryReportResponse,
  SummaryReportResponse,
  SummaryReportSnapshot,
  summaryReportResponseSchema,
} from '@workspace/schemas';
import { db } from '../../lib/db';
import { toIsoDateTime } from '../../lib/date-utils';
import { createAuditLog, createFailureLog } from '../audit-logs/audit-logs.service';
import type { AuditLogContext } from '../audit-logs/audit-logs.types';
import {
  buildSummaryReportSnapshot,
  sourceAdapters,
} from './summary-report-source.adapter';

export async function createSummaryReportForUser(
  userId: string,
  dto: CreateSummaryReport,
  auditLogContext: AuditLogContext,
): Promise<CreateSummaryReportResponse> {
  try {
    if (dto.selectedIds.length === 0) {
      throw new Error('กรุณาเลือกรายการก่อนสร้างรายงาน');
    }

    const previousReport = await db.summaryReport.findUnique({
      where: { userId },
    });
    const reportSnapshot = await _buildSnapshot(dto);

    const report = await db.$transaction(async (tx) => {
      if (previousReport) {
        await tx.summaryReport.delete({
          where: { id: previousReport.id },
        });

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

      const createdReport = await tx.summaryReport.create({
        data: {
          userId,
          source:
            dto.source === 'employees'
              ? SummaryReportSource.employees
              : SummaryReportSource.courses,
          selectedIds: dto.selectedIds,
          filtersSnapshot: dto.filtersSnapshot,
          reportSnapshot,
        },
      });

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

export async function findLatestSummaryReportForUser(userId: string): Promise<SummaryReportResponse> {
  const report = await db.summaryReport.findUnique({
    where: { userId },
  });

  if (!report) {
    throw new Error('ไม่พบรายงานล่าสุด');
  }

  return toResponse(report);
}

export async function findSummaryReportByIdForUser(
  userId: string,
  reportId: string,
): Promise<SummaryReportResponse> {
  const report = await db.summaryReport.findUnique({
    where: { id: reportId },
  });

  if (!report || report.userId !== userId) {
    throw new Error('ไม่พบรายงานที่ต้องการ');
  }

  return toResponse(report);
}

export async function deleteSummaryReportByIdForUser(
  userId: string,
  reportId: string,
  auditLogContext: AuditLogContext,
): Promise<void> {
  try {
    const report = await db.summaryReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.userId !== userId) {
      throw new Error('ไม่พบรายงานที่ต้องการ');
    }

    await db.$transaction(async (tx) => {
      await tx.summaryReport.delete({
        where: { id: reportId },
      });

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

async function _buildSnapshot(
  dto: CreateSummaryReport,
): Promise<SummaryReportSnapshot> {
  return buildSummaryReportSnapshot(
    sourceAdapters,
    dto,
    new Date().toISOString(),
  );
}

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

// สรุปข้อผิดพลาดให้อยู่ในรูปแบบ JSON ที่อ่านย้อนหลังได้ง่าย
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
