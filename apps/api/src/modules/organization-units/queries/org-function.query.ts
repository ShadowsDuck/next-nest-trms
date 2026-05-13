import { db } from '@/lib/db';
import { throwNotFound } from '@/lib/http-errors';

/**
 * ดึงรายการ Functions
 */
export async function getFunctionsQuery(businessUnitId?: string) {
  return await db.orgFunction.findMany({
    where: businessUnitId ? { businessUnitId } : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * บันทึก Function ใหม่
 */
export async function createFunctionQuery(
  name: string,
  businessUnitId: string,
) {
  return await db.orgFunction.create({
    data: { name, businessUnitId },
  });
}

/**
 * อัปเดตข้อมูล Function
 */
export async function updateFunctionQuery(
  id: string,
  data: { name?: string; businessUnitId?: string },
) {
  return await db.orgFunction.update({
    where: { id },
    data,
  });
}

/**
 * ตรวจสอบความมีอยู่ของ Function
 */
export async function getFunctionByIdQuery(id: string) {
  const orgFunction = await db.orgFunction.findUnique({
    where: { id },
  });

  if (!orgFunction) {
    throwNotFound('ไม่พบ Function ที่ระบุ');
  }

  return orgFunction;
}
