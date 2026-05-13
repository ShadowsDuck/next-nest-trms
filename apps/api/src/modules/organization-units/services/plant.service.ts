import { PlantResponse } from '@workspace/schemas';
import { toIsoDateTime } from '../../../utils/date-utils';
import {
  createPlantQuery,
  getPlantByIdQuery,
  getPlantsQuery,
  updatePlantQuery,
} from '../queries/plant.query';

/**
 * ดึงข้อมูล Plants ทั้งหมด
 */
export async function getPlantsService(): Promise<PlantResponse[]> {
  const plants = await getPlantsQuery();
  return plants.map((plant) => ({
    id: plant.id,
    name: plant.name,
    createdAt: toIsoDateTime(plant.createdAt),
    updatedAt: toIsoDateTime(plant.updatedAt),
  }));
}

/**
 * สร้าง Plant ใหม่
 */
export async function createPlantService(createPlantDto: {
  name: string;
}): Promise<PlantResponse> {
  const plant = await createPlantQuery(createPlantDto.name);
  return {
    id: plant.id,
    name: plant.name,
    createdAt: toIsoDateTime(plant.createdAt),
    updatedAt: toIsoDateTime(plant.updatedAt),
  };
}

/**
 * อัปเดต Plant
 */
export async function updatePlantService(
  id: string,
  updatePlantDto: { name?: string },
): Promise<PlantResponse> {
  await ensurePlantExists(id);
  const plant = await updatePlantQuery(id, updatePlantDto.name ?? '');
  return {
    id: plant.id,
    name: plant.name,
    createdAt: toIsoDateTime(plant.createdAt),
    updatedAt: toIsoDateTime(plant.updatedAt),
  };
}

/**
 * ตรวจสอบว่า Plant มีอยู่จริง
 */
export async function ensurePlantExists(id: string) {
  const plant = await getPlantByIdQuery(id);
  if (!plant) {
    throw new Error('ไม่พบ Plant ที่ระบุ');
  }
  return plant;
}
