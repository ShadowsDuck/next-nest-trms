import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';
import type { AuditLogContext } from './audit-logs.types';

// สร้าง context สำหรับ audit log จาก session และ request ของผู้ใช้ปัจจุบัน
export function createAuditLogContext(
  session: UserSession,
  request: Request,
): AuditLogContext {
  const userAgent = request.headers['user-agent'];

  return {
    userId: session.user.id,
    ipAddress: request.ip ?? null,
    userAgent: Array.isArray(userAgent)
      ? userAgent.join(', ')
      : (userAgent ?? null),
  };
}
