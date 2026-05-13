import { DepartmentQuery, DepartmentResponse } from '@workspace/schemas';
import { mapDepartment } from '../lib/organization-units.mapper';
import { rethrowDuplicateNameError } from '../lib/organization-units.utils';
import {
  createDepartmentQuery,
  getDepartmentByIdQuery,
  getDepartmentsQuery,
  updateDepartmentQuery,
} from '../queries/department.query';
import { ensureDivisionExists } from './division.service';

/**
 * ดึงข้อมูล Departments
 */
export async function getDepartmentsService(
  query: DepartmentQuery,
): Promise<DepartmentResponse[]> {
  if (query.divisionId) {
    await ensureDivisionExists(query.divisionId);
  }

  const departments = await getDepartmentsQuery(query.divisionId);
  return departments.map(mapDepartment);
}

/**
 * สร้าง Department ใหม่
 */
export async function createDepartmentService(createDepartmentDto: {
  name: string;
  divisionId: string;
}): Promise<DepartmentResponse> {
  await ensureDivisionExists(createDepartmentDto.divisionId);

  try {
    const department = await createDepartmentQuery(
      createDepartmentDto.name,
      createDepartmentDto.divisionId,
    );
    return mapDepartment(department);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * อัปเดต Department
 */
export async function updateDepartmentService(
  id: string,
  updateDepartmentDto: { name?: string; divisionId?: string },
): Promise<DepartmentResponse> {
  await getDepartmentByIdQuery(id);

  if (updateDepartmentDto.divisionId) {
    await ensureDivisionExists(updateDepartmentDto.divisionId);
  }

  try {
    const department = await updateDepartmentQuery(id, updateDepartmentDto);
    return mapDepartment(department);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Department มีอยู่จริง
 * @throws {HTTPException} 404 ถ้าไม่พบ
 */
export async function ensureDepartmentExists(id: string) {
  return await getDepartmentByIdQuery(id);
}
