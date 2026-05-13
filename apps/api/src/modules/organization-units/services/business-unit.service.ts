import { BusinessUnitQuery, BusinessUnitResponse } from '@workspace/schemas';
import { mapBusinessUnit } from '../lib/organization-units.mapper';
import { rethrowDuplicateNameError } from '../lib/organization-units.utils';
import {
  createBusinessUnitQuery,
  getBusinessUnitByIdQuery,
  getBusinessUnitsQuery,
  updateBusinessUnitQuery,
} from '../queries/business-unit.query';
import { ensurePlantExists } from './plant.service';

/**
 * ดึงข้อมูล Business Units
 */
export async function getBusinessUnitsService(
  query: BusinessUnitQuery,
): Promise<BusinessUnitResponse[]> {
  if (query.plantId) {
    await ensurePlantExists(query.plantId);
  }

  const businessUnits = await getBusinessUnitsQuery(query.plantId);
  return businessUnits.map(mapBusinessUnit);
}

/**
 * สร้าง Business Unit ใหม่
 */
export async function createBusinessUnitService(createBusinessUnitDto: {
  name: string;
  plantId: string;
}): Promise<BusinessUnitResponse> {
  await ensurePlantExists(createBusinessUnitDto.plantId);

  try {
    const businessUnit = await createBusinessUnitQuery(
      createBusinessUnitDto.name,
      createBusinessUnitDto.plantId,
    );
    return mapBusinessUnit(businessUnit);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * อัปเดต Business Unit
 */
export async function updateBusinessUnitService(
  id: string,
  updateBusinessUnitDto: { name?: string; plantId?: string },
): Promise<BusinessUnitResponse> {
  // getBusinessUnitByIdQuery จะ throw 404 ถ้าไม่พบ
  await getBusinessUnitByIdQuery(id);

  if (updateBusinessUnitDto.plantId) {
    await ensurePlantExists(updateBusinessUnitDto.plantId);
  }

  try {
    const businessUnit = await updateBusinessUnitQuery(
      id,
      updateBusinessUnitDto,
    );
    return mapBusinessUnit(businessUnit);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Business Unit มีอยู่จริง
 * @throws {HTTPException} 404 ถ้าไม่พบ
 */
export async function ensureBusinessUnitExists(id: string) {
  return await getBusinessUnitByIdQuery(id);
}
