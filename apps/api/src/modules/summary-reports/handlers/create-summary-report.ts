import { CreateSummaryReport } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { createSummaryReportService } from '../services/create-summary-report.service';

/**
 * Handler สำหรับการสร้างรายงานสรุปใหม่
 */
export async function createSummaryReportHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const auditContext = {
    userId: user.id,
    ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
    userAgent: c.req.header('user-agent') || 'Unknown',
  };
  const body = c.req.valid('json' as never) as CreateSummaryReport;

  try {
    const result = await createSummaryReportService(
      user.id,
      body,
      auditContext,
    );
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
