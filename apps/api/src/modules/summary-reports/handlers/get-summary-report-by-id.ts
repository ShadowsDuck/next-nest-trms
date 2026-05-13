import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getSummaryReportByIdService } from '../services/get-summary-report-by-id.service';

/**
 * Handler สำหรับดึงรายงานตาม ID
 */
export async function getSummaryReportByIdHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const id = c.req.param('id');
  try {
    const result = await getSummaryReportByIdService(user.id, id);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
}
