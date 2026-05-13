import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { extractAuditContext } from '../../audit-logs';
import { deleteSummaryReportService } from '../services/delete-summary-report.service';

/**
 * Handler สำหรับลบรายงานตาม ID
 */
export async function deleteSummaryReportByIdHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const id = c.req.param('id');
  const auditContext = extractAuditContext(c);

  try {
    await deleteSummaryReportService(user.id, id, auditContext);
    return new Response(null, { status: 204 });
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
}
