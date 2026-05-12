import { Prisma } from '@workspace/database';
import { db } from '../../../lib/db';

/**
 * บันทึก Audit Log ลงฐานข้อมูล
 */
export async function createAuditLogQuery(
  data: Prisma.AuditLogUncheckedCreateInput,
  tx: Prisma.TransactionClient = db,
) {
  return await tx.auditLog.create({
    data,
  });
}
