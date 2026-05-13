import { DivisionQuery, DivisionResponse } from '@workspace/schemas';
import { mapDivision } from '../lib/organization-units.mapper';
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
  return divisions.map(mapDivision);
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
    return mapDivision(division);
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
  await getDivisionByIdQuery(id);

  if (updateDivisionDto.functionId) {
    await ensureFunctionExists(updateDivisionDto.functionId);
  }

  try {
    const division = await updateDivisionQuery(id, updateDivisionDto);
    return mapDivision(division);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Division มีอยู่จริง
 * @throws {HTTPException} 404 ถ้าไม่พบ
 */
export async function ensureDivisionExists(id: string) {
  return await getDivisionByIdQuery(id);
}
