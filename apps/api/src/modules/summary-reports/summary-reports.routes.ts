import { zValidator } from '@hono/zod-validator';
import { createSummaryReportSchema } from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { createSummaryReportHandler } from './handlers/create-summary-report';
import { deleteSummaryReportByIdHandler } from './handlers/delete-summary-report';
import { getLatestSummaryReportHandler } from './handlers/get-latest-summary-report';
import { getSummaryReportByIdHandler } from './handlers/get-summary-report-by-id';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .post(
    '/',
    zValidator('json', createSummaryReportSchema),
    createSummaryReportHandler,
  )
  .get('/latest', getLatestSummaryReportHandler)
  .get('/:id', getSummaryReportByIdHandler)
  .delete('/:id', deleteSummaryReportByIdHandler);

export default routes;
export type SummaryReportsRoute = typeof routes;
