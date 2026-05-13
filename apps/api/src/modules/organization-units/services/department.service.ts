import { DepartmentQuery, DepartmentResponse } from '@workspace/schemas';
import { throwNotFound } from '../../../lib/http-errors';
import { toIsoDateTime } from '../../../utils/date-utils';
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
  return departments.map((department) => ({
    id: department.id,
    name: department.name,
    divisionId: department.divisionId,
    createdAt: toIsoDateTime(department.createdAt),
    updatedAt: toIsoDateTime(department.updatedAt),
  }));
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
    return {
      id: department.id,
      name: department.name,
      divisionId: department.divisionId,
      createdAt: toIsoDateTime(department.createdAt),
      updatedAt: toIsoDateTime(department.updatedAt),
    };
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
  await ensureDepartmentExists(id);

  if (updateDepartmentDto.divisionId) {
    await ensureDivisionExists(updateDepartmentDto.divisionId);
  }

  try {
    const department = await updateDepartmentQuery(id, updateDepartmentDto);
    return {
      id: department.id,
      name: department.name,
      divisionId: department.divisionId,
      createdAt: toIsoDateTime(department.createdAt),
      updatedAt: toIsoDateTime(department.updatedAt),
    };
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Department มีอยู่จริง
 */
export async function ensureDepartmentExists(id: string) {
  const department = await getDepartmentByIdQuery(id);
  if (!department) {
    throwNotFound('ไม่พบ Department ที่ระบุ');
  }
  return department;
}
