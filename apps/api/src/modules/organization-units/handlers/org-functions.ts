import { zValidator } from '@hono/zod-validator';
import {
  orgFunctionQuerySchema,
  orgFunctionSchema,
  updateOrgFunctionSchema,
} from '@workspace/schemas';
import { createFactory } from 'hono/factory';
import { HonoEnv } from '../../../types/hono';
import {
  createFunctionService,
  getFunctionsService,
  updateFunctionService,
} from '../services/org-function.service';

const factory = createFactory<HonoEnv>();
const app = factory.createApp();

export const functionsRoutes = app
  /**
   * Handler สำหรับดึง Functions
   */
  .get('/', zValidator('query', orgFunctionQuerySchema), async (c) => {
    const query = c.req.valid('query');
    try {
      const result = await getFunctionsService(query);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  })
  /**
   * Handler สำหรับสร้าง Function
   */
  .post('/', zValidator('json', orgFunctionSchema), async (c) => {
    const body = c.req.valid('json');
    try {
      const result = await createFunctionService(body);
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  })
  /**
   * Handler สำหรับอัปเดต Function
   */
  .patch('/:id', zValidator('json', updateOrgFunctionSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    try {
      const result = await updateFunctionService(id, body);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  });
