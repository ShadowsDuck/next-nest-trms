import { zValidator } from '@hono/zod-validator';
import { plantSchema, updatePlantSchema } from '@workspace/schemas';
import { createFactory } from 'hono/factory';
import { HonoEnv } from '../../../types/hono';
import {
  createPlantService,
  getPlantsService,
  updatePlantService,
} from '../services/plant.service';

const factory = createFactory<HonoEnv>();

/**
 * Handler สำหรับดึง Plants
 */
export const getPlantsHandler = factory.createHandlers(async (c) => {
  const result = await getPlantsService();
  return c.json(result, 200);
});

/**
 * Handler สำหรับสร้าง Plant
 */
export const createPlantHandler = factory.createHandlers(
  zValidator('json', plantSchema),
  async (c) => {
    const body = c.req.valid('json');
    try {
      const result = await createPlantService(body);
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

/**
 * Handler สำหรับอัปเดต Plant
 */
export const updatePlantHandler = factory.createHandlers(
  zValidator('json', updatePlantSchema),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    try {
      const result = await updatePlantService(id, body);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);
