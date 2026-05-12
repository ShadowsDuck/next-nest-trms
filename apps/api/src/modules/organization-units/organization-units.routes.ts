import { zValidator } from '@hono/zod-validator';
import {
  businessUnitQuerySchema,
  businessUnitSchema,
  departmentQuerySchema,
  departmentSchema,
  divisionQuerySchema,
  divisionSchema,
  orgFunctionQuerySchema,
  orgFunctionSchema,
  plantSchema,
  updateBusinessUnitSchema,
  updateDepartmentSchema,
  updateDivisionSchema,
  updateOrgFunctionSchema,
  updatePlantSchema,
} from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import {
  createBusinessUnitHandler,
  getBusinessUnitsHandler,
  updateBusinessUnitHandler,
} from './handlers/business-units';
import {
  createDepartmentHandler,
  getDepartmentsHandler,
  updateDepartmentHandler,
} from './handlers/departments';
import {
  createDivisionHandler,
  getDivisionsHandler,
  updateDivisionHandler,
} from './handlers/divisions';
import {
  createFunctionHandler,
  getFunctionsHandler,
  updateFunctionHandler,
} from './handlers/org-functions';
import {
  createPlantHandler,
  getPlantsHandler,
  updatePlantHandler,
} from './handlers/plants';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  // Plants
  .get('/plants', getPlantsHandler)
  .post('/plants', zValidator('json', plantSchema), createPlantHandler)
  .patch(
    '/plants/:id',
    zValidator('json', updatePlantSchema),
    updatePlantHandler,
  )
  // Business Units
  .get(
    '/business-units',
    zValidator('query', businessUnitQuerySchema),
    getBusinessUnitsHandler,
  )
  .post(
    '/business-units',
    zValidator('json', businessUnitSchema),
    createBusinessUnitHandler,
  )
  .patch(
    '/business-units/:id',
    zValidator('json', updateBusinessUnitSchema),
    updateBusinessUnitHandler,
  )
  // Functions
  .get(
    '/functions',
    zValidator('query', orgFunctionQuerySchema),
    getFunctionsHandler,
  )
  .post(
    '/functions',
    zValidator('json', orgFunctionSchema),
    createFunctionHandler,
  )
  .patch(
    '/functions/:id',
    zValidator('json', updateOrgFunctionSchema),
    updateFunctionHandler,
  )
  // Divisions
  .get(
    '/divisions',
    zValidator('query', divisionQuerySchema),
    getDivisionsHandler,
  )
  .post('/divisions', zValidator('json', divisionSchema), createDivisionHandler)
  .patch(
    '/divisions/:id',
    zValidator('json', updateDivisionSchema),
    updateDivisionHandler,
  )
  // Departments
  .get(
    '/departments',
    zValidator('query', departmentQuerySchema),
    getDepartmentsHandler,
  )
  .post(
    '/departments',
    zValidator('json', departmentSchema),
    createDepartmentHandler,
  )
  .patch(
    '/departments/:id',
    zValidator('json', updateDepartmentSchema),
    updateDepartmentHandler,
  );

export default routes;
export type OrganizationUnitsRoute = typeof routes;
