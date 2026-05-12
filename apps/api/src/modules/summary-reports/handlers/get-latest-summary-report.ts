import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getLatestSummaryReportService } from '../services/get-summary-report.service';

/**
 * Handler สำหรับดึงรายงานล่าสุดของผู้ใช้ปัจจุบัน
 */
export async function getLatestSummaryReportHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  try {
    const result = await getLatestSummaryReportService(user.id);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
}
