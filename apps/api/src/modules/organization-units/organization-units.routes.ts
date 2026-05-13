import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { businessUnitsRoutes } from './handlers/business-units';
import { departmentsRoutes } from './handlers/departments';
import { divisionsRoutes } from './handlers/divisions';
import { functionsRoutes } from './handlers/org-functions';
import { plantsRoutes } from './handlers/plants';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .route('/plants', plantsRoutes)
  .route('/business-units', businessUnitsRoutes)
  .route('/functions', functionsRoutes)
  .route('/divisions', divisionsRoutes)
  .route('/departments', departmentsRoutes);

export default routes;
export type OrganizationUnitsRoute = typeof routes;
