import { zValidator } from '@hono/zod-validator';
import { createSummaryReportSchema } from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middlewares/auth';
import {
  createSummaryReportForUser,
  deleteSummaryReportByIdForUser,
  findLatestSummaryReportForUser,
  findSummaryReportByIdForUser,
} from './summary-reports.service';

const summaryReportsRouter = new Hono<{
  Variables: { user: { id: string; [key: string]: any }; session: any };
}>();

summaryReportsRouter.use('/*', requireAuth);

// สร้างรายงานสรุปใหม่
summaryReportsRouter.post(
  '/',
  zValidator('json', createSummaryReportSchema),
  async (c) => {
    const user = c.get('user');
    const auditContext = {
      userId: user.id,
      ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
      userAgent: c.req.header('user-agent') || 'Unknown',
    };
    const body = c.req.valid('json');

    try {
      const result = await createSummaryReportForUser(
        user.id,
        body,
        auditContext,
      );
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

// ดึงรายงานล่าสุดของผู้ใช้ปัจจุบัน
summaryReportsRouter.get('/latest', async (c) => {
  const user = c.get('user');
  try {
    const result = await findLatestSummaryReportForUser(user.id);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
});

// ดึงรายงานตาม reportId
summaryReportsRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  try {
    const result = await findSummaryReportByIdForUser(user.id, id);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
});

// ลบรายงานตาม reportId
summaryReportsRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const auditContext = {
    userId: user.id,
    ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
    userAgent: c.req.header('user-agent') || 'Unknown',
  };

  try {
    await deleteSummaryReportByIdForUser(user.id, id, auditContext);
    return new Response(null, { status: 204 });
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
});

export default summaryReportsRouter;
