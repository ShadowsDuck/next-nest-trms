import { db } from '@/lib/db';
import { throwNotFound } from '@/lib/http-errors';

/**
 * ดึงรายการ Business Units
 */
export async function getBusinessUnitsQuery(plantId?: string) {
  return await db.businessUnit.findMany({
    where: plantId ? { plantId } : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * บันทึก Business Unit ใหม่
 */
export async function createBusinessUnitQuery(name: string, plantId: string) {
  return await db.businessUnit.create({
    data: { name, plantId },
  });
}

/**
 * อัปเดตข้อมูล Business Unit
 */
export async function updateBusinessUnitQuery(
  id: string,
  data: { name?: string; plantId?: string },
) {
  return await db.businessUnit.update({
    where: { id },
    data,
  });
}

/**
 * ดึงข้อมูล Business Unit ตาม ID
 * @throws {HTTPException} 404 ถ้าไม่พบข้อมูล
 */
export async function getBusinessUnitByIdQuery(id: string) {
  const businessUnit = await db.businessUnit.findUnique({
    where: { id },
  });

  if (!businessUnit) {
    throwNotFound('ไม่พบ Business Unit ที่ระบุ');
  }

  return businessUnit;
}
