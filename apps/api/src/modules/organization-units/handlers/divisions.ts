import { zValidator } from '@hono/zod-validator';
import {
  divisionQuerySchema,
  divisionSchema,
  updateDivisionSchema,
} from '@workspace/schemas';
import { createFactory } from 'hono/factory';
import { HonoEnv } from '../../../types/hono';
import {
  createDivisionService,
  getDivisionsService,
  updateDivisionService,
} from '../services/division.service';

const factory = createFactory<HonoEnv>();

/**
 * Handler สำหรับดึง Divisions
 */
export const getDivisionsHandler = factory.createHandlers(
  zValidator('query', divisionQuerySchema),
  async (c) => {
    const query = c.req.valid('query');
    try {
      const result = await getDivisionsService(query);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

/**
 * Handler สำหรับสร้าง Division
 */
export const createDivisionHandler = factory.createHandlers(
  zValidator('json', divisionSchema),
  async (c) => {
    const body = c.req.valid('json');
    try {
      const result = await createDivisionService(body);
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

/**
 * Handler สำหรับอัปเดต Division
 */
export const updateDivisionHandler = factory.createHandlers(
  zValidator('json', updateDivisionSchema),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    try {
      const result = await updateDivisionService(id, body);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);
