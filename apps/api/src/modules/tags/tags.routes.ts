import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { getTagsHandler } from './handlers/get-tags';

const tagsRouter = new Hono<HonoEnv>();

// Middleware ตรวจสอบการล็อกอิน
tagsRouter.use('/*', requireAuth);

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูลหมวดหมู่ (tags)
 */
tagsRouter.get('/', getTagsHandler);

export default tagsRouter;
