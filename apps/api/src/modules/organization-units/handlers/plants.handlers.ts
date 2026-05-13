import { plantSchema, updatePlantSchema } from '@workspace/schemas';
import { Context } from 'hono';
import { z } from 'zod';
import {
  HonoEnv,
  JsonContext,
  JsonWithParamContext,
} from '../../../types/hono';
import {
  createPlantService,
  getPlantsService,
  updatePlantService,
} from '../services/plant.service';

/**
 * Handler สำหรับดึงข้อมูล Plants ทั้งหมด
 */
export const getPlants = async (c: Context<HonoEnv>) => {
  const result = await getPlantsService();
  return c.json(result, 200);
};

/**
 * Handler สำหรับสร้าง Plant ใหม่
 */
export const createPlant = async (
  c: JsonContext<z.infer<typeof plantSchema>>,
) => {
  const body = c.req.valid('json');
  const result = await createPlantService(body);
  return c.json(result, 201);
};

/**
 * Handler สำหรับอัปเดตข้อมูล Plant
 */
export const updatePlant = async (
  c: JsonWithParamContext<z.infer<typeof updatePlantSchema>>,
) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const result = await updatePlantService(id, body);
  return c.json(result, 200);
};
