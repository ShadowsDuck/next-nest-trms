import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { getMeHandler } from './handlers/get-me';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .get('/me', getMeHandler);

export default routes;
export type UsersRoute = typeof routes;
