import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';

/**
 * Handler สำหรับดึงข้อมูลผู้ใช้งานปัจจุบัน
 */
export async function getMeHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  return c.json(user);
}
