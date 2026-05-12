import { zValidator } from '@hono/zod-validator';
import { courseQuerySchema } from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { createCourseHandler } from './handlers/create-course';
import { getCoursesHandler } from './handlers/get-courses';

const routes = new Hono<HonoEnv>()
  .use('/*', requireAuth)
  .post('/', createCourseHandler)
  .get('/', zValidator('query', courseQuerySchema), getCoursesHandler);

export default routes;
export type CoursesRoute = typeof routes;
