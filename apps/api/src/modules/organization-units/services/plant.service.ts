import { PlantResponse } from '@workspace/schemas';
import { mapPlant } from '../lib/organization-units.mapper';
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
  return plants.map(mapPlant);
}

/**
 * สร้าง Plant ใหม่
 */
export async function createPlantService(createPlantDto: {
  name: string;
}): Promise<PlantResponse> {
  const plant = await createPlantQuery(createPlantDto.name);
  return mapPlant(plant);
}

/**
 * อัปเดต Plant
 */
export async function updatePlantService(
  id: string,
  updatePlantDto: { name?: string },
): Promise<PlantResponse> {
  await getPlantByIdQuery(id);
  const plant = await updatePlantQuery(id, updatePlantDto.name ?? '');
  return mapPlant(plant);
}

/**
 * ตรวจสอบว่า Plant มีอยู่จริง
 * @throws {HTTPException} 404 ถ้าไม่พบ
 */
export async function ensurePlantExists(id: string) {
  return await getPlantByIdQuery(id);
}
