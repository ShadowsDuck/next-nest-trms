import { zValidator } from '@hono/zod-validator';
import {
  employeeImportDryRunRequestSchema,
  employeeImportRequestSchema,
  employeeQuerySchema,
  employeeSchema,
} from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { createEmployeeHandler } from './handlers/create-employee';
import { getEmployeeByNoHandler } from './handlers/get-employee-by-no';
import { getEmployeesHandler } from './handlers/get-employees';
import { importDryRunHandler } from './handlers/import-dry-run';
import { importEmployeesHandler } from './handlers/import-employees';

const employeesRouter = new Hono<HonoEnv>();

employeesRouter.use('/*', requireAuth);

/**
 * เส้นทาง (Routes) สำหรับการนำเข้าพนักงาน
 */
employeesRouter.post(
  '/import/dry-run',
  zValidator('json', employeeImportDryRunRequestSchema),
  importDryRunHandler,
);

employeesRouter.post(
  '/import',
  zValidator('json', employeeImportRequestSchema),
  importEmployeesHandler,
);

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูลพนักงาน
 */
employeesRouter.post(
  '/',
  zValidator('json', employeeSchema),
  createEmployeeHandler,
);
employeesRouter.get(
  '/',
  zValidator('query', employeeQuerySchema),
  getEmployeesHandler,
);
employeesRouter.get('/:employeeNo', getEmployeeByNoHandler);

export default employeesRouter;
