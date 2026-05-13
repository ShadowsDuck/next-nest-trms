import {
  departmentQuerySchema,
  departmentSchema,
  updateDepartmentSchema,
} from '@workspace/schemas';
import { z } from 'zod';
import {
  JsonContext,
  JsonWithParamContext,
  QueryContext,
} from '../../../types/hono';
import {
  createDepartmentService,
  getDepartmentsService,
  updateDepartmentService,
} from '../services/department.service';

/**
 * Handler สำหรับดึงข้อมูล Departments
 */
export const getDepartments = async (
  c: QueryContext<z.infer<typeof departmentQuerySchema>>,
) => {
  const query = c.req.valid('query');
  const result = await getDepartmentsService(query);
  return c.json(result, 200);
};

/**
 * Handler สำหรับสร้าง Department ใหม่
 */
export const createDepartment = async (
  c: JsonContext<z.infer<typeof departmentSchema>>,
) => {
  const body = c.req.valid('json');
  const result = await createDepartmentService(body);
  return c.json(result, 201);
};

/**
 * Handler สำหรับอัปเดตข้อมูล Department
 */
export const updateDepartment = async (
  c: JsonWithParamContext<z.infer<typeof updateDepartmentSchema>>,
) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const result = await updateDepartmentService(id, body);
  return c.json(result, 200);
};
