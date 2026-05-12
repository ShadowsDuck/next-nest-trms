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

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .post(
    '/import/dry-run',
    zValidator('json', employeeImportDryRunRequestSchema),
    importDryRunHandler,
  )
  .post(
    '/import',
    zValidator('json', employeeImportRequestSchema),
    importEmployeesHandler,
  )
  .post('/', zValidator('json', employeeSchema), createEmployeeHandler)
  .get('/', zValidator('query', employeeQuerySchema), getEmployeesHandler)
  .get('/:employeeNo', getEmployeeByNoHandler);

export default routes;
export type EmployeesRoute = typeof routes;
