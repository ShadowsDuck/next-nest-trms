import { Hono } from 'hono';
import { requireAuth } from '../../middlewares/auth';

const usersRouter = new Hono<{ Variables: { user: any; session: any } }>();

// Middleware ตรวจสอบการล็อกอิน
usersRouter.use('/*', requireAuth);

// ดึงข้อมูลผู้ใช้งานปัจจุบัน
usersRouter.get('/me', async (c) => {
  const user = c.get('user');
  return c.json(user);
});

export default usersRouter;
