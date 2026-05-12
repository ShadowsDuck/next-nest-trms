import { AuditLogQuery } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getAuditLogsService } from '../services/audit-logs-read.service';

/**
 * Handler สำหรับดึงข้อมูล audit logs แบบแบ่งหน้า
 */
export async function getAuditLogsHandler(c: Context<HonoEnv>) {
  const query = c.req.valid('query' as never) as AuditLogQuery;
  try {
    const result = await getAuditLogsService(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
