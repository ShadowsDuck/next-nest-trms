import { DivisionQuery, DivisionResponse } from '@workspace/schemas';
import { throwNotFound } from '../../../lib/http-errors';
import { toIsoDateTime } from '../../../utils/date-utils';
import { rethrowDuplicateNameError } from '../lib/organization-units.utils';
import {
  createDivisionQuery,
  getDivisionByIdQuery,
  getDivisionsQuery,
  updateDivisionQuery,
} from '../queries/division.query';
import { ensureFunctionExists } from './org-function.service';

/**
 * ดึงข้อมูล Divisions
 */
export async function getDivisionsService(
  query: DivisionQuery,
): Promise<DivisionResponse[]> {
  if (query.functionId) {
    await ensureFunctionExists(query.functionId);
  }

  const divisions = await getDivisionsQuery(query.functionId);
  return divisions.map((division) => ({
    id: division.id,
    name: division.name,
    functionId: division.functionId,
    createdAt: toIsoDateTime(division.createdAt),
    updatedAt: toIsoDateTime(division.updatedAt),
  }));
}

/**
 * สร้าง Division ใหม่
 */
export async function createDivisionService(createDivisionDto: {
  name: string;
  functionId: string;
}): Promise<DivisionResponse> {
  await ensureFunctionExists(createDivisionDto.functionId);

  try {
    const division = await createDivisionQuery(
      createDivisionDto.name,
      createDivisionDto.functionId,
    );
    return {
      id: division.id,
      name: division.name,
      functionId: division.functionId,
      createdAt: toIsoDateTime(division.createdAt),
      updatedAt: toIsoDateTime(division.updatedAt),
    };
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * อัปเดต Division
 */
export async function updateDivisionService(
  id: string,
  updateDivisionDto: { name?: string; functionId?: string },
): Promise<DivisionResponse> {
  await ensureDivisionExists(id);

  if (updateDivisionDto.functionId) {
    await ensureFunctionExists(updateDivisionDto.functionId);
  }

  try {
    const division = await updateDivisionQuery(id, updateDivisionDto);
    return {
      id: division.id,
      name: division.name,
      functionId: division.functionId,
      createdAt: toIsoDateTime(division.createdAt),
      updatedAt: toIsoDateTime(division.updatedAt),
    };
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Division มีอยู่จริง
 */
export async function ensureDivisionExists(id: string) {
  const division = await getDivisionByIdQuery(id);
  if (!division) {
    throwNotFound('ไม่พบ Division ที่ระบุ');
  }
  return division;
}
