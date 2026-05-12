import { AuditAction, Prisma } from '@workspace/database';
import { db } from '../../../lib/db';
import type { CreateAuditLogInput } from '../audit-logs.types';
import { createAuditLogQuery } from '../queries/create-audit-log.query';

type AuditLogDbClient = typeof db | Prisma.TransactionClient;

/**
 * บันทึก audit log สำหรับทุก action โดยรองรับทั้ง client ปกติและ transaction client
 */
export async function createAuditLog(
  input: CreateAuditLogInput,
  dbClient: AuditLogDbClient = db,
): Promise<void> {
  await createAuditLogQuery(
    {
      action: input.action,
      model: input.model,
      recordId: input.recordId ?? null,
      oldValues: toAuditJsonValue(input.oldValues),
      newValues: toAuditJsonValue(input.newValues),
      userId: input.context.userId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
    },
    dbClient,
  );
}

/**
 * พยายามบันทึก failed log โดยไม่ให้ข้อผิดพลาดของ audit log กลบ error หลัก
 */
export async function createFailureLog(
  input: Omit<CreateAuditLogInput, 'action'>,
  dbClient: AuditLogDbClient = db,
): Promise<void> {
  try {
    await createAuditLog(
      {
        ...input,
        action: AuditAction.Failed,
      },
      dbClient,
    );
  } catch (error) {
    console.error(
      'บันทึก failed audit log ไม่สำเร็จ',
      error instanceof Error ? error.stack : undefined,
    );
  }
}

/**
 * แปลงข้อมูลให้เป็น JSON ที่ Prisma บันทึกได้อย่างปลอดภัย
 */
function toAuditJsonValue(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return JSON.parse(
    JSON.stringify(value, (_key, currentValue: unknown) => {
      if (typeof currentValue === 'bigint') {
        return currentValue.toString();
      }

      if (Buffer.isBuffer(currentValue)) {
        return `[buffer:${currentValue.length}]`;
      }

      return currentValue;
    }),
  ) as Prisma.InputJsonValue;
}
