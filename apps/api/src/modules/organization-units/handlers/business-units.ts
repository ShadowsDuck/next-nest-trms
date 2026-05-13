import { zValidator } from '@hono/zod-validator';
import {
  businessUnitQuerySchema,
  businessUnitSchema,
  updateBusinessUnitSchema,
} from '@workspace/schemas';
import { createFactory } from 'hono/factory';
import { HonoEnv } from '../../../types/hono';
import {
  createBusinessUnitService,
  getBusinessUnitsService,
  updateBusinessUnitService,
} from '../services/business-unit.service';

const factory = createFactory<HonoEnv>();
const app = factory.createApp();

export const businessUnitsRoutes = app
  /**
   * Handler สำหรับดึง Business Units
   */
  .get('/', zValidator('query', businessUnitQuerySchema), async (c) => {
    const query = c.req.valid('query');
    try {
      const result = await getBusinessUnitsService(query);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  })
  /**
   * Handler สำหรับสร้าง Business Unit
   */
  .post('/', zValidator('json', businessUnitSchema), async (c) => {
    const body = c.req.valid('json');
    try {
      const result = await createBusinessUnitService(body);
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  })
  /**
   * Handler สำหรับอัปเดต Business Unit
   */
  .patch('/:id', zValidator('json', updateBusinessUnitSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    try {
      const result = await updateBusinessUnitService(id, body);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  });
