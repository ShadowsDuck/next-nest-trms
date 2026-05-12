import { CreateSummaryReport } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { extractAuditContext } from '../../audit-logs';
import { createSummaryReportService } from '../services/create-summary-report.service';

/**
 * Handler สำหรับการสร้างรายงานสรุปใหม่
 */
export async function createSummaryReportHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const auditContext = extractAuditContext(c);
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
