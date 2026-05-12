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

const orgUnitsRouter = new Hono<HonoEnv>();

orgUnitsRouter.use('/*', requireAuth);

// Plants
orgUnitsRouter.get('/plants', getPlantsHandler);
orgUnitsRouter.post(
  '/plants',
  zValidator('json', plantSchema),
  createPlantHandler,
);
orgUnitsRouter.patch(
  '/plants/:id',
  zValidator('json', updatePlantSchema),
  updatePlantHandler,
);

// Business Units
orgUnitsRouter.get(
  '/business-units',
  zValidator('query', businessUnitQuerySchema),
  getBusinessUnitsHandler,
);
orgUnitsRouter.post(
  '/business-units',
  zValidator('json', businessUnitSchema),
  createBusinessUnitHandler,
);
orgUnitsRouter.patch(
  '/business-units/:id',
  zValidator('json', updateBusinessUnitSchema),
  updateBusinessUnitHandler,
);

// Functions
orgUnitsRouter.get(
  '/functions',
  zValidator('query', orgFunctionQuerySchema),
  getFunctionsHandler,
);
orgUnitsRouter.post(
  '/functions',
  zValidator('json', orgFunctionSchema),
  createFunctionHandler,
);
orgUnitsRouter.patch(
  '/functions/:id',
  zValidator('json', updateOrgFunctionSchema),
  updateFunctionHandler,
);

// Divisions
orgUnitsRouter.get(
  '/divisions',
  zValidator('query', divisionQuerySchema),
  getDivisionsHandler,
);
orgUnitsRouter.post(
  '/divisions',
  zValidator('json', divisionSchema),
  createDivisionHandler,
);
orgUnitsRouter.patch(
  '/divisions/:id',
  zValidator('json', updateDivisionSchema),
  updateDivisionHandler,
);

// Departments
orgUnitsRouter.get(
  '/departments',
  zValidator('query', departmentQuerySchema),
  getDepartmentsHandler,
);
orgUnitsRouter.post(
  '/departments',
  zValidator('json', departmentSchema),
  createDepartmentHandler,
);
orgUnitsRouter.patch(
  '/departments/:id',
  zValidator('json', updateDepartmentSchema),
  updateDepartmentHandler,
);

export default orgUnitsRouter;
