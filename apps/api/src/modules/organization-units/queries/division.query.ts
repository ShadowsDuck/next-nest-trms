import { db } from '../../../lib/db';

/**
 * ดึงรายการ Divisions
 */
export async function getDivisionsQuery(functionId?: string) {
  return await db.division.findMany({
    where: functionId ? { functionId } : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * บันทึก Division ใหม่
 */
export async function createDivisionQuery(name: string, functionId: string) {
  return await db.division.create({
    data: { name, functionId },
  });
}

/**
 * อัปเดตข้อมูล Division
 */
export async function updateDivisionQuery(
  id: string,
  data: { name?: string; functionId?: string },
) {
  return await db.division.update({
    where: { id },
    data,
  });
}

/**
 * ตรวจสอบความมีอยู่ของ Division
 */
export async function getDivisionByIdQuery(id: string) {
  return await db.division.findUnique({
    where: { id },
  });
}
