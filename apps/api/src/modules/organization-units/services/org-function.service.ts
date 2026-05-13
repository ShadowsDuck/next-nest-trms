import { OrgFunctionQuery, OrgFunctionResponse } from '@workspace/schemas';
import { throwNotFound } from '../../../lib/http-errors';
import { toIsoDateTime } from '../../../utils/date-utils';
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
  return orgFunctions.map((orgFunction) => ({
    id: orgFunction.id,
    name: orgFunction.name,
    businessUnitId: orgFunction.businessUnitId,
    createdAt: toIsoDateTime(orgFunction.createdAt),
    updatedAt: toIsoDateTime(orgFunction.updatedAt),
  }));
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
    return {
      id: orgFunction.id,
      name: orgFunction.name,
      businessUnitId: orgFunction.businessUnitId,
      createdAt: toIsoDateTime(orgFunction.createdAt),
      updatedAt: toIsoDateTime(orgFunction.updatedAt),
    };
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
  await ensureFunctionExists(id);

  if (updateOrgFunctionDto.businessUnitId) {
    await ensureBusinessUnitExists(updateOrgFunctionDto.businessUnitId);
  }

  try {
    const orgFunction = await updateFunctionQuery(id, updateOrgFunctionDto);
    return {
      id: orgFunction.id,
      name: orgFunction.name,
      businessUnitId: orgFunction.businessUnitId,
      createdAt: toIsoDateTime(orgFunction.createdAt),
      updatedAt: toIsoDateTime(orgFunction.updatedAt),
    };
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Function มีอยู่จริง
 */
export async function ensureFunctionExists(id: string) {
  const orgFunction = await getFunctionByIdQuery(id);
  if (!orgFunction) {
    throwNotFound('ไม่พบ Function ที่ระบุ');
  }
  return orgFunction;
}
