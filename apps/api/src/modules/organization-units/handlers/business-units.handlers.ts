import {
  businessUnitQuerySchema,
  businessUnitSchema,
  updateBusinessUnitSchema,
} from '@workspace/schemas';
import { z } from 'zod';
import {
  JsonContext,
  JsonWithParamContext,
  QueryContext,
} from '../../../types/hono';
import {
  createBusinessUnitService,
  getBusinessUnitsService,
  updateBusinessUnitService,
} from '../services/business-unit.service';

/**
 * Handler สำหรับดึงข้อมูล Business Units
 */
export const getBusinessUnits = async (
  c: QueryContext<z.infer<typeof businessUnitQuerySchema>>,
) => {
  const query = c.req.valid('query');
  const result = await getBusinessUnitsService(query);
  return c.json(result, 200);
};

/**
 * Handler สำหรับสร้าง Business Unit ใหม่
 */
export const createBusinessUnit = async (
  c: JsonContext<z.infer<typeof businessUnitSchema>>,
) => {
  const body = c.req.valid('json');
  const result = await createBusinessUnitService(body);
  return c.json(result, 201);
};

/**
 * Handler สำหรับอัปเดตข้อมูล Business Unit
 */
export const updateBusinessUnit = async (
  c: JsonWithParamContext<z.infer<typeof updateBusinessUnitSchema>>,
) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const result = await updateBusinessUnitService(id, body);
  return c.json(result, 200);
};
