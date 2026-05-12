import { db } from '../../../lib/db';

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
 * ตรวจสอบความมีอยู่ของ Business Unit
 */
export async function getBusinessUnitByIdQuery(id: string) {
  return await db.businessUnit.findUnique({
    where: { id },
  });
}
