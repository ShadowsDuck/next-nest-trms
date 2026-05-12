import { db } from '../../../lib/db';

/**
 * ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูล
 */
export async function checkDatabaseConnectionQuery() {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
