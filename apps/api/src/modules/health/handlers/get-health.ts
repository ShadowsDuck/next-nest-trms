import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getHealthQuery } from '../queries/get-health.query';

/**
 * Handler สำหรับตรวจสอบความพร้อมของระบบ
 */
export async function getHealthHandler(c: Context<HonoEnv>) {
  const isDbUp = await getHealthQuery();

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
