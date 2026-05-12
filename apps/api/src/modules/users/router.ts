import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';

const usersRouter = new Hono<HonoEnv>();

// Middleware ตรวจสอบการล็อกอิน
usersRouter.use('/*', requireAuth);

// ดึงข้อมูลผู้ใช้งานปัจจุบัน
usersRouter.get('/me', (c) => {
  const user = c.get('user');
  return c.json(user);
});

export default usersRouter;
