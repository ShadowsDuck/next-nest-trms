import { db } from '../../../lib/db';

/**
 * ดึงรายการ model ทั้งหมดที่มีอยู่ใน audit logs
 */
export async function getAuditModelsQuery() {
  return await db.auditLog.findMany({
    select: {
      model: true,
    },
    distinct: ['model'],
    orderBy: {
      model: 'asc',
    },
  });
}
