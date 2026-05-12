import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../middlewares/auth';
import {
  createBusinessUnit,
  createDepartment,
  createDivision,
  createFunction,
  createPlant,
  findBusinessUnits,
  findDepartments,
  findDivisions,
  findFunctions,
  findPlants,
  updateBusinessUnit,
  updateDepartment,
  updateDivision,
  updateFunction,
  updatePlant,
} from './organization-units.service';

// Need to import/create validation schemas. In NestJS they used DTOs which had Zod validation,
// so we should use schemas from @workspace/schemas if available, or just mock them out here if needed.
// Wait, @workspace/schemas should have org units schemas? I will check or skip zValidator for org units for now
// if schemas are not available. Actually, the DTOs used `createZodDto` but I'll import from `@workspace/schemas` if they exist.
// For now, let's implement the router.

import {
  businessUnitQuerySchema,
  createBusinessUnitSchema,
  createDepartmentSchema,
  createDivisionSchema,
  createOrgFunctionSchema,
  createPlantSchema,
  departmentQuerySchema,
  divisionQuerySchema,
  orgFunctionQuerySchema,
  updateBusinessUnitSchema,
  updateDepartmentSchema,
  updateDivisionSchema,
  updateOrgFunctionSchema,
  updatePlantSchema,
} from '@workspace/schemas';

const orgUnitsRouter = new Hono<{ Variables: { user: any; session: any } }>();

orgUnitsRouter.use('/*', requireAuth);

// Plants
orgUnitsRouter.get('/plants', async (c) => {
  const result = await findPlants();
  return c.json(result, 200);
});

orgUnitsRouter.post('/plants', zValidator('json', createPlantSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await createPlant(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.patch('/plants/:id', zValidator('json', updatePlantSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  try {
    const result = await updatePlant(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

// Business Units
orgUnitsRouter.get('/business-units', zValidator('query', businessUnitQuerySchema), async (c) => {
  const query = c.req.valid('query');
  try {
    const result = await findBusinessUnits(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.post('/business-units', zValidator('json', createBusinessUnitSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await createBusinessUnit(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.patch('/business-units/:id', zValidator('json', updateBusinessUnitSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  try {
    const result = await updateBusinessUnit(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

// Functions
orgUnitsRouter.get('/functions', zValidator('query', orgFunctionQuerySchema), async (c) => {
  const query = c.req.valid('query');
  try {
    const result = await findFunctions(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.post('/functions', zValidator('json', createOrgFunctionSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await createFunction(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.patch('/functions/:id', zValidator('json', updateOrgFunctionSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  try {
    const result = await updateFunction(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

// Divisions
orgUnitsRouter.get('/divisions', zValidator('query', divisionQuerySchema), async (c) => {
  const query = c.req.valid('query');
  try {
    const result = await findDivisions(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.post('/divisions', zValidator('json', createDivisionSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await createDivision(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.patch('/divisions/:id', zValidator('json', updateDivisionSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  try {
    const result = await updateDivision(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

// Departments
orgUnitsRouter.get('/departments', zValidator('query', departmentQuerySchema), async (c) => {
  const query = c.req.valid('query');
  try {
    const result = await findDepartments(query);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.post('/departments', zValidator('json', createDepartmentSchema), async (c) => {
  const body = c.req.valid('json');
  try {
    const result = await createDepartment(body);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

orgUnitsRouter.patch('/departments/:id', zValidator('json', updateDepartmentSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  try {
    const result = await updateDepartment(id, body);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

export default orgUnitsRouter;
