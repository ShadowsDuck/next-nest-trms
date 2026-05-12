import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { checkDatabaseConnectionQuery } from '../queries/health.query';

/**
 * Handler สำหรับตรวจสอบความพร้อมของระบบ
 */
export async function checkHealthHandler(c: Context<HonoEnv>) {
  const isDbUp = await checkDatabaseConnectionQuery();

  if (!isDbUp) {
    return c.json(
      {
        status: 'error',
        database: 'down',
        uptime: Number(process.uptime().toFixed(2)),
        timestamp: new Date().toISOString(),
      },
      503,
    );
  }

  return c.json({
    status: 'ok',
    database: 'up',
    uptime: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  });
}
