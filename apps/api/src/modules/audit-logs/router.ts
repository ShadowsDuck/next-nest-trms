import { zValidator } from '@hono/zod-validator';
import { auditLogQuerySchema } from '@workspace/schemas';
import { factory } from '../../lib/factory';
import { requireAuth } from '../../middlewares/auth';
import { findAllAuditLogs, findAllAuditModels } from './audit-logs.service';

const auditLogsRouter = factory.createApp();

auditLogsRouter.use('/*', requireAuth);

// ดึงรายการโมเดลทั้งหมดของ audit logs
auditLogsRouter.get('/models', async (c) => {
  try {
    const result = await findAllAuditModels();
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 500);
  }
});

// ดึงข้อมูล audit logs แบบแบ่งหน้า
auditLogsRouter.get(
  '/',
  zValidator('query', auditLogQuerySchema),
  async (c) => {
    const query = c.req.valid('query');
    try {
      const result = await findAllAuditLogs(query);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

export default auditLogsRouter;
