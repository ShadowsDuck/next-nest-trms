import { OrgFunctionQuery, OrgFunctionType } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import {
  createFunctionService,
  getFunctionsService,
  updateFunctionService,
} from '../services/org-function.service';

/**
 * Handler สำหรับดึง Functions
 */
export async function getFunctionsHandler(c: Context<HonoEnv>) {
  const query = c.req.valid('query' as never) as OrgFunctionQuery;
  try {
    const result = await getFunctionsService(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับสร้าง Function
 */
export async function createFunctionHandler(c: Context<HonoEnv>) {
  const body = c.req.valid('json' as never) as OrgFunctionType;
  try {
    const result = await createFunctionService(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับอัปเดต Function
 */
export async function updateFunctionHandler(c: Context<HonoEnv>) {
  const id = c.req.param('id');
  const body = c.req.valid('json' as never) as Partial<OrgFunctionType>;
  try {
    const result = await updateFunctionService(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
