import { zValidator } from '@hono/zod-validator';
import {
  departmentQuerySchema,
  departmentSchema,
  updateDepartmentSchema,
} from '@workspace/schemas';
import { createFactory } from 'hono/factory';
import { HonoEnv } from '../../../types/hono';
import {
  createDepartmentService,
  getDepartmentsService,
  updateDepartmentService,
} from '../services/department.service';

const factory = createFactory<HonoEnv>();

/**
 * Handler สำหรับดึง Departments
 */
export const getDepartmentsHandler = factory.createHandlers(
  zValidator('query', departmentQuerySchema),
  async (c) => {
    const query = c.req.valid('query');
    try {
      const result = await getDepartmentsService(query);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

/**
 * Handler สำหรับสร้าง Department
 */
export const createDepartmentHandler = factory.createHandlers(
  zValidator('json', departmentSchema),
  async (c) => {
    const body = c.req.valid('json');
    try {
      const result = await createDepartmentService(body);
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

/**
 * Handler สำหรับอัปเดต Department
 */
export const updateDepartmentHandler = factory.createHandlers(
  zValidator('json', updateDepartmentSchema),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    try {
      const result = await updateDepartmentService(id, body);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);
