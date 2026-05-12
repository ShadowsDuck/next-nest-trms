import { BusinessUnitQuery, BusinessUnitType } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import {
  createBusinessUnitService,
  getBusinessUnitsService,
  updateBusinessUnitService,
} from '../services/business-unit.service';

/**
 * Handler สำหรับดึง Business Units
 */
export async function getBusinessUnitsHandler(c: Context<HonoEnv>) {
  const query = c.req.valid('query' as never) as BusinessUnitQuery;
  try {
    const result = await getBusinessUnitsService(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับสร้าง Business Unit
 */
export async function createBusinessUnitHandler(c: Context<HonoEnv>) {
  const body = c.req.valid('json' as never) as BusinessUnitType;
  try {
    const result = await createBusinessUnitService(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับอัปเดต Business Unit
 */
export async function updateBusinessUnitHandler(c: Context<HonoEnv>) {
  const id = c.req.param('id');
  const body = c.req.valid('json' as never) as Partial<BusinessUnitType>;
  try {
    const result = await updateBusinessUnitService(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
