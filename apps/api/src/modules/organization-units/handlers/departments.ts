import { DepartmentQuery, DepartmentType } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import {
  createDepartmentService,
  getDepartmentsService,
  updateDepartmentService,
} from '../services/department.service';

/**
 * Handler สำหรับดึง Departments
 */
export async function getDepartmentsHandler(c: Context<HonoEnv>) {
  const query = c.req.valid('query' as never) as DepartmentQuery;
  try {
    const result = await getDepartmentsService(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับสร้าง Department
 */
export async function createDepartmentHandler(c: Context<HonoEnv>) {
  const body = c.req.valid('json' as never) as DepartmentType;
  try {
    const result = await createDepartmentService(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * Handler สำหรับอัปเดต Department
 */
export async function updateDepartmentHandler(c: Context<HonoEnv>) {
  const id = c.req.param('id');
  const body = c.req.valid('json' as never) as Partial<DepartmentType>;
  try {
    const result = await updateDepartmentService(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
