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
import * as businessUnitsHandlers from './handlers/business-units.handlers';
import * as departmentsHandlers from './handlers/departments.handlers';
import * as divisionsHandlers from './handlers/divisions.handlers';
import * as functionsHandlers from './handlers/org-functions.handlers';
import * as plantsHandlers from './handlers/plants.handlers';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  // Plants
  .get('/plants', plantsHandlers.getPlants)
  .post('/plants', zValidator('json', plantSchema), plantsHandlers.createPlant)
  .patch(
    '/plants/:id',
    zValidator('json', updatePlantSchema),
    plantsHandlers.updatePlant,
  )
  // Business Units
  .get(
    '/business-units',
    zValidator('query', businessUnitQuerySchema),
    businessUnitsHandlers.getBusinessUnits,
  )
  .post(
    '/business-units',
    zValidator('json', businessUnitSchema),
    businessUnitsHandlers.createBusinessUnit,
  )
  .patch(
    '/business-units/:id',
    zValidator('json', updateBusinessUnitSchema),
    businessUnitsHandlers.updateBusinessUnit,
  )
  // Functions
  .get(
    '/functions',
    zValidator('query', orgFunctionQuerySchema),
    functionsHandlers.getFunctions,
  )
  .post(
    '/functions',
    zValidator('json', orgFunctionSchema),
    functionsHandlers.createFunction,
  )
  .patch(
    '/functions/:id',
    zValidator('json', updateOrgFunctionSchema),
    functionsHandlers.updateFunction,
  )
  // Divisions
  .get(
    '/divisions',
    zValidator('query', divisionQuerySchema),
    divisionsHandlers.getDivisions,
  )
  .post(
    '/divisions',
    zValidator('json', divisionSchema),
    divisionsHandlers.createDivision,
  )
  .patch(
    '/divisions/:id',
    zValidator('json', updateDivisionSchema),
    divisionsHandlers.updateDivision,
  )
  // Departments
  .get(
    '/departments',
    zValidator('query', departmentQuerySchema),
    departmentsHandlers.getDepartments,
  )
  .post(
    '/departments',
    zValidator('json', departmentSchema),
    departmentsHandlers.createDepartment,
  )
  .patch(
    '/departments/:id',
    zValidator('json', updateDepartmentSchema),
    departmentsHandlers.updateDepartment,
  );

export default routes;
export type OrganizationUnitsRoute = typeof routes;
