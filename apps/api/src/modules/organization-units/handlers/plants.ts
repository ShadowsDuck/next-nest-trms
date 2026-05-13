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
const app = factory.createApp();

export const plantsRoutes = app
  /**
   * Handler สำหรับดึง Plants
   */
  .get('/', async (c) => {
    const result = await getPlantsService();
    return c.json(result, 200);
  })
  /**
   * Handler สำหรับสร้าง Plant
   */
  .post('/', zValidator('json', plantSchema), async (c) => {
    const body = c.req.valid('json');
    try {
      const result = await createPlantService(body);
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  })
  /**
   * Handler สำหรับอัปเดต Plant
   */
  .patch('/:id', zValidator('json', updatePlantSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    try {
      const result = await updatePlantService(id, body);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  });
