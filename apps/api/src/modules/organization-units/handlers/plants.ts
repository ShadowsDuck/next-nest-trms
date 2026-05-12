import { PlantType } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import {
  createPlantService,
  getPlantsService,
  updatePlantService,
} from '../services/plant.service';

/**
 * Handler สำหรับดึง Plants
 */
export async function getPlantsHandler(c: Context<HonoEnv>) {
  const result = await getPlantsService();
  return c.json(result, 200);
}

/**
 * Handler สำหรับสร้าง Plant
 */
export async function createPlantHandler(c: Context<HonoEnv>) {
  const body = c.req.valid('json' as never) as PlantType;
  try {
    const result = await createPlantService(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับอัปเดต Plant
 */
export async function updatePlantHandler(c: Context<HonoEnv>) {
  const id = c.req.param('id');
  const body = c.req.valid('json' as never) as Partial<PlantType>;
  try {
    const result = await updatePlantService(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
