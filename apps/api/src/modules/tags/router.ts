import { factory } from '../../lib/factory';
import { requireAuth } from '../../middlewares/auth';
import { findAllTags } from './tags.service';

const tagsRouter = factory.createApp();

// Middleware ตรวจสอบการล็อกอิน
tagsRouter.use('/*', requireAuth);

// ดึงรายการหมวดหมู่ทั้งหมด
tagsRouter.get('/', async (c) => {
  const response = await findAllTags();
  return c.json(response);
});

export default tagsRouter;
