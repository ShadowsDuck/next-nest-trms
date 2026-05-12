import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { deleteSummaryReportService } from '../services/delete-summary-report.service';

/**
 * Handler สำหรับลบรายงานตาม ID
 */
export async function deleteSummaryReportByIdHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const id = c.req.param('id');
  const auditContext = {
    userId: user.id,
    ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
    userAgent: c.req.header('user-agent') || 'Unknown',
  };

  try {
    await deleteSummaryReportService(user.id, id, auditContext);
    return new Response(null, { status: 204 });
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
}
