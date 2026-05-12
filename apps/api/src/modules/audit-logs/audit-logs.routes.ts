import { zValidator } from '@hono/zod-validator';
import { auditLogQuerySchema } from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { getAuditLogsHandler } from './handlers/get-audit-logs';
import { getAuditModelsHandler } from './handlers/get-audit-models';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .get('/models', getAuditModelsHandler)
  .get('/', zValidator('query', auditLogQuerySchema), getAuditLogsHandler);

export default routes;
export type AuditLogsRoute = typeof routes;
