import { db } from '../../../lib/db';

/**
 * ดึงรายการ Departments
 */
export async function getDepartmentsQuery(divisionId?: string) {
  return await db.department.findMany({
    where: divisionId ? { divisionId } : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * บันทึก Department ใหม่
 */
export async function createDepartmentQuery(name: string, divisionId: string) {
  return await db.department.create({
    data: { name, divisionId },
  });
}

/**
 * อัปเดตข้อมูล Department
 */
export async function updateDepartmentQuery(
  id: string,
  data: { name?: string; divisionId?: string },
) {
  return await db.department.update({
    where: { id },
    data,
  });
}

/**
 * ตรวจสอบความมีอยู่ของ Department
 */
export async function getDepartmentByIdQuery(id: string) {
  return await db.department.findUnique({
    where: { id },
  });
}
