import type {
  AuditLogPaginationResponse,
  AuditLogQuery,
} from '@workspace/schemas';
import { formatAuditLog } from '../lib/audit-logs.mapper';
import { getAuditLogsQuery } from '../queries/get-audit-logs.query';
import { getAuditModelsQuery } from '../queries/get-audit-models.query';

/**
 * ดึง audit logs แบบแบ่งหน้าโดยรองรับ filter และ search จากหน้า admin
 */
export async function getAuditLogsService(
  queryDto: AuditLogQuery,
): Promise<AuditLogPaginationResponse> {
  const { page, limit } = queryDto;
  const { auditLogs, total } = await getAuditLogsQuery(queryDto);

  return {
    data: auditLogs.map((auditLog) => formatAuditLog(auditLog)),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * ดึงรายการ model ทั้งหมดที่มีอยู่ใน audit logs แบบไม่ผูกกับ filter ปัจจุบัน
 */
export async function getAuditModelsService(): Promise<string[]> {
  const models = await getAuditModelsQuery();
  return models.map((item) => item.model);
}
