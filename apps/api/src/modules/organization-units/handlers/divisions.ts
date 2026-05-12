import { DivisionQuery, DivisionType } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import {
  createDivisionService,
  getDivisionsService,
  updateDivisionService,
} from '../services/division.service';

/**
 * Handler สำหรับดึง Divisions
 */
export async function getDivisionsHandler(c: Context<HonoEnv>) {
  const query = c.req.valid('query' as never) as DivisionQuery;
  try {
    const result = await getDivisionsService(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับสร้าง Division
 */
export async function createDivisionHandler(c: Context<HonoEnv>) {
  const body = c.req.valid('json' as never) as DivisionType;
  try {
    const result = await createDivisionService(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับอัปเดต Division
 */
export async function updateDivisionHandler(c: Context<HonoEnv>) {
  const id = c.req.param('id');
  const body = c.req.valid('json' as never) as Partial<DivisionType>;
  try {
    const result = await updateDivisionService(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
