import {
  divisionQuerySchema,
  divisionSchema,
  updateDivisionSchema,
} from '@workspace/schemas';
import { z } from 'zod';
import {
  JsonContext,
  JsonWithParamContext,
  QueryContext,
} from '../../../types/hono';
import {
  createDivisionService,
  getDivisionsService,
  updateDivisionService,
} from '../services/division.service';

/**
 * Handler สำหรับดึงข้อมูล Divisions
 */
export const getDivisions = async (
  c: QueryContext<z.infer<typeof divisionQuerySchema>>,
) => {
  const query = c.req.valid('query');
  const result = await getDivisionsService(query);
  return c.json(result, 200);
};

/**
 * Handler สำหรับสร้าง Division ใหม่
 */
export const createDivision = async (
  c: JsonContext<z.infer<typeof divisionSchema>>,
) => {
  const body = c.req.valid('json');
  const result = await createDivisionService(body);
  return c.json(result, 201);
};

/**
 * Handler สำหรับอัปเดตข้อมูล Division
 */
export const updateDivision = async (
  c: JsonWithParamContext<z.infer<typeof updateDivisionSchema>>,
) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const result = await updateDivisionService(id, body);
  return c.json(result, 200);
};
