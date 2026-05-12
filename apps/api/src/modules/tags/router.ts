import { Hono } from 'hono';
import { requireAuth } from '../../middlewares/auth';
import { findAllTags } from './tags.service';

const tagsRouter = new Hono<{ Variables: { user: any; session: any } }>();

// Middleware ตรวจสอบการล็อกอิน
tagsRouter.use('/*', requireAuth);

// ดึงรายการหมวดหมู่ทั้งหมด
tagsRouter.get('/', async (c) => {
  const response = await findAllTags();
  return c.json(response);
});

export default tagsRouter;
