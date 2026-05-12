import { Hono } from 'hono';
import { requireAuth } from '../../middlewares/auth';

const usersRouter = new Hono<{
  Variables: { user: { id: string; [key: string]: any }; session: any };
}>();

// Middleware ตรวจสอบการล็อกอิน
usersRouter.use('/*', requireAuth);

// ดึงข้อมูลผู้ใช้งานปัจจุบัน
usersRouter.get('/me', (c) => {
  const user = c.get('user');
  return c.json(user);
});

export default usersRouter;
