import { zValidator } from '@hono/zod-validator';
import { courseQuerySchema } from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { createCourseHandler } from './handlers/create-course';
import { getCoursesHandler } from './handlers/get-courses';

const coursesRouter = new Hono<HonoEnv>();

coursesRouter.use('/*', requireAuth);

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูลหลักสูตร
 */
coursesRouter.post('/', createCourseHandler);
coursesRouter.get(
  '/',
  zValidator('query', courseQuerySchema),
  getCoursesHandler,
);

export default coursesRouter;
