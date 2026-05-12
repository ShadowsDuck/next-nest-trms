import { db } from '../../lib/db';

// ตรวจสอบความพร้อมของระบบและฐานข้อมูล
export async function checkHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    return {
      status: 'error',
      database: 'down',
      uptime: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
    };
  }

  return {
    status: 'ok',
    database: 'up',
    uptime: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}
