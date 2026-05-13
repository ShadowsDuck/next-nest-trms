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
  .get('/plants', ...getPlantsHandler)
  .post('/plants', ...createPlantHandler)
  .patch('/plants/:id', ...updatePlantHandler)
  // Business Units
  .get('/business-units', ...getBusinessUnitsHandler)
  .post('/business-units', ...createBusinessUnitHandler)
  .patch('/business-units/:id', ...updateBusinessUnitHandler)
  // Functions
  .get('/functions', ...getFunctionsHandler)
  .post('/functions', ...createFunctionHandler)
  .patch('/functions/:id', ...updateFunctionHandler)
  // Divisions
  .get('/divisions', ...getDivisionsHandler)
  .post('/divisions', ...createDivisionHandler)
  .patch('/divisions/:id', ...updateDivisionHandler)
  // Departments
  .get('/departments', ...getDepartmentsHandler)
  .post('/departments', ...createDepartmentHandler)
  .patch('/departments/:id', ...updateDepartmentHandler);

export default routes;
export type OrganizationUnitsRoute = typeof routes;
