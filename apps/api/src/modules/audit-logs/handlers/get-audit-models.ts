import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getAuditModelsService } from '../services/audit-logs-read.service';

/**
 * Handler สำหรับดึงรายการ model ทั้งหมดที่มีอยู่ใน audit logs
 */
export async function getAuditModelsHandler(c: Context<HonoEnv>) {
  try {
    const result = await getAuditModelsService();
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 500);
  }
}
