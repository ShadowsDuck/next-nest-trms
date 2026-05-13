import { db } from '@/lib/db';
import { throwNotFound } from '@/lib/http-errors';

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
  const division = await db.division.findUnique({
    where: { id },
  });

  if (!division) {
    throwNotFound('ไม่พบ Division ที่ระบุ');
  }

  return division;
}
