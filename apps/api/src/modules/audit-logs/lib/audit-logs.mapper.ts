import { AuditLog, User } from '@workspace/database';
import type { AuditLog as AuditLogResponse } from '@workspace/schemas';
import { toIsoDateTime } from 'src/utils/date-utils';

export type AuditLogWithUser = AuditLog & {
  user: User;
};

// แปลง audit log จาก Prisma ให้ตรงกับ response contract ของ API
export function formatAuditLog(auditLog: AuditLogWithUser): AuditLogResponse {
  return {
    id: auditLog.id,
    action: auditLog.action,
    model: auditLog.model,
    recordId: auditLog.recordId,
    oldValues: auditLog.oldValues,
    newValues: auditLog.newValues,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    timestamp: toIsoDateTime(auditLog.timestamp),
    userId: auditLog.userId,
    user: {
      id: auditLog.user.id,
      name: auditLog.user.name,
      email: auditLog.user.email,
    },
  };
}
