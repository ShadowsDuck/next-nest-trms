import { BusinessUnitQuery, BusinessUnitResponse } from '@workspace/schemas';
import { toIsoDateTime } from '../../../utils/date-utils';
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
  return businessUnits.map((businessUnit) => ({
    id: businessUnit.id,
    name: businessUnit.name,
    plantId: businessUnit.plantId,
    createdAt: toIsoDateTime(businessUnit.createdAt),
    updatedAt: toIsoDateTime(businessUnit.updatedAt),
  }));
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
    return {
      id: businessUnit.id,
      name: businessUnit.name,
      plantId: businessUnit.plantId,
      createdAt: toIsoDateTime(businessUnit.createdAt),
      updatedAt: toIsoDateTime(businessUnit.updatedAt),
    };
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
  await ensureBusinessUnitExists(id);

  if (updateBusinessUnitDto.plantId) {
    await ensurePlantExists(updateBusinessUnitDto.plantId);
  }

  try {
    const businessUnit = await updateBusinessUnitQuery(
      id,
      updateBusinessUnitDto,
    );
    return {
      id: businessUnit.id,
      name: businessUnit.name,
      plantId: businessUnit.plantId,
      createdAt: toIsoDateTime(businessUnit.createdAt),
      updatedAt: toIsoDateTime(businessUnit.updatedAt),
    };
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า Business Unit มีอยู่จริง
 */
export async function ensureBusinessUnitExists(id: string) {
  const businessUnit = await getBusinessUnitByIdQuery(id);
  if (!businessUnit) {
    throw new Error('ไม่พบ Business Unit ที่ระบุ');
  }
  return businessUnit;
}
