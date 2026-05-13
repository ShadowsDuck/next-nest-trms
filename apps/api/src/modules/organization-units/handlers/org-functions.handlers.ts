import {
  orgFunctionQuerySchema,
  orgFunctionSchema,
  updateOrgFunctionSchema,
} from '@workspace/schemas';
import { z } from 'zod';
import {
  JsonContext,
  JsonWithParamContext,
  QueryContext,
} from '../../../types/hono';
import {
  createFunctionService,
  getFunctionsService,
  updateFunctionService,
} from '../services/org-function.service';

/**
 * Handler สำหรับดึงข้อมูล Functions
 */
export const getFunctions = async (
  c: QueryContext<z.infer<typeof orgFunctionQuerySchema>>,
) => {
  const query = c.req.valid('query');
  const result = await getFunctionsService(query);
  return c.json(result, 200);
};

/**
 * Handler สำหรับสร้าง Function ใหม่
 */
export const createFunction = async (
  c: JsonContext<z.infer<typeof orgFunctionSchema>>,
) => {
  const body = c.req.valid('json');
  const result = await createFunctionService(body);
  return c.json(result, 201);
};

/**
 * Handler สำหรับอัปเดตข้อมูล Function
 */
export const updateFunction = async (
  c: JsonWithParamContext<z.infer<typeof updateOrgFunctionSchema>>,
) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const result = await updateFunctionService(id, body);
  return c.json(result, 200);
};
