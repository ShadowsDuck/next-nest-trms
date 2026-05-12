import { db } from '../../../lib/db';

/**
 * ดึงรายการ Plants ทั้งหมด
 */
export async function getPlantsQuery() {
  return await db.plant.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * บันทึก Plant ใหม่
 */
export async function createPlantQuery(name: string) {
  return await db.plant.create({
    data: { name },
  });
}

/**
 * อัปเดตข้อมูล Plant
 */
export async function updatePlantQuery(id: string, name: string) {
  return await db.plant.update({
    where: { id },
    data: { name },
  });
}

/**
 * ตรวจสอบความมีอยู่ของ Plant
 */
export async function getPlantByIdQuery(id: string) {
  return await db.plant.findUnique({
    where: { id },
  });
}
