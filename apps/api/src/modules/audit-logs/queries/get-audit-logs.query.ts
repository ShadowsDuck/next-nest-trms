import { Prisma } from '@workspace/database';
import type { AuditLogQuery } from '@workspace/schemas';
import { db } from '../../../lib/db';
import { buildAuditLogWhereInput } from '../lib/audit-log-where.builder';

/**
 * ค้นหาข้อมูล Audit Logs พร้อมการแบ่งหน้าและนับจำนวนทั้งหมด
 */
export async function getAuditLogsQuery(queryDto: AuditLogQuery) {
  const { page, limit } = queryDto;
  const where = buildAuditLogWhereInput(queryDto);

  const [auditLogs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        {
          timestamp: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    }),
    db.auditLog.count({ where }),
  ]);

  return { auditLogs, total };
}
