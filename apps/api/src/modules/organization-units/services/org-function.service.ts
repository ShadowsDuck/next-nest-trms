import { OrgFunctionQuery, OrgFunctionResponse } from '@workspace/schemas';
import { mapOrgFunction } from '../lib/organization-units.mapper';
import { rethrowDuplicateNameError } from '../lib/organization-units.utils';
import {
  createFunctionQuery,
  getFunctionByIdQuery,
  getFunctionsQuery,
  updateFunctionQuery,
} from '../queries/org-function.query';
import { ensureBusinessUnitExists } from './business-unit.service';

/**
 * ดึงข้อมูล Functions
 */
export async function getFunctionsService(
  query: OrgFunctionQuery,
): Promise<OrgFunctionResponse[]> {
  if (query.businessUnitId) {
    await ensureBusinessUnitExists(query.businessUnitId);
  }

  const orgFunctions = await getFunctionsQuery(query.businessUnitId);
  return orgFunctions.map(mapOrgFunction);
}

/**
 * สร้าง Function ใหม่
 */
export async function createFunctionService(createOrgFunctionDto: {
  name: string;
  businessUnitId: string;
}): Promise<OrgFunctionResponse> {
  await ensureBusinessUnitExists(createOrgFunctionDto.businessUnitId);

  try {
    const orgFunction = await createFunctionQuery(
      createOrgFunctionDto.name,
      createOrgFunctionDto.businessUnitId,
    );
    return mapOrgFunction(orgFunction);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * อัปเดต Function
 */
export async function updateFunctionService(
  id: string,
  updateOrgFunctionDto: { name?: string; businessUnitId?: string },
): Promise<OrgFunctionResponse> {
  await getFunctionByIdQuery(id);

  if (updateOrgFunctionDto.businessUnitId) {
    await ensureBusinessUnitExists(updateOrgFunctionDto.businessUnitId);
  }

  try {
    const orgFunction = await updateFunctionQuery(id, updateOrgFunctionDto);
    return mapOrgFunction(orgFunction);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Function มีอยู่จริง
 * @throws {HTTPException} 404 ถ้าไม่พบ
 */
export async function ensureFunctionExists(id: string) {
  return await getFunctionByIdQuery(id);
}
