import { AuditAction } from '@workspace/database';

export type AuditLogContext = {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type CreateAuditLogInput = {
  action: AuditAction;
  model: string;
  recordId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  context: AuditLogContext;
};
