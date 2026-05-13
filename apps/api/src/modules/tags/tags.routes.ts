import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { getTagsHandler } from './handlers/get-tags';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .get('/', getTagsHandler);

export default routes;
export type TagsRoute = typeof routes;
