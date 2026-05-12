import { zValidator } from '@hono/zod-validator';
import { auditLogQuerySchema } from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { getAuditLogsHandler } from './handlers/get-audit-logs';
import { getAuditModelsHandler } from './handlers/get-audit-models';

const auditLogsRouter = new Hono<HonoEnv>();

auditLogsRouter.use('/*', requireAuth);

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูล Audit Logs
 */
auditLogsRouter.get('/models', getAuditModelsHandler);
auditLogsRouter.get(
  '/',
  zValidator('query', auditLogQuerySchema),
  getAuditLogsHandler,
);

export default auditLogsRouter;
