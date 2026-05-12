import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { findAllTags } from './tags.service';

const tagsRouter = new Hono<HonoEnv>();

// Middleware ตรวจสอบการล็อกอิน
tagsRouter.use('/*', requireAuth);

// ดึงรายการหมวดหมู่ทั้งหมด
tagsRouter.get('/', async (c) => {
  const response = await findAllTags();
  return c.json(response);
});

export default tagsRouter;
