import { zValidator } from '@hono/zod-validator';
import { createSummaryReportSchema } from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { createSummaryReportHandler } from './handlers/create-summary-report';
import { deleteSummaryReportByIdHandler } from './handlers/delete-summary-report';
import { getLatestSummaryReportHandler } from './handlers/get-latest-summary-report';
import { getSummaryReportByIdHandler } from './handlers/get-summary-report-by-id';

const summaryReportsRouter = new Hono<HonoEnv>();

summaryReportsRouter.use('/*', requireAuth);

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูลรายงานสรุป
 */
summaryReportsRouter.post(
  '/',
  zValidator('json', createSummaryReportSchema),
  createSummaryReportHandler,
);
summaryReportsRouter.get('/latest', getLatestSummaryReportHandler);
summaryReportsRouter.get('/:id', getSummaryReportByIdHandler);
summaryReportsRouter.delete('/:id', deleteSummaryReportByIdHandler);

export default summaryReportsRouter;
