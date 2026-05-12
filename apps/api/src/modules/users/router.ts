import { factory } from '../../lib/factory';
import { requireAuth } from '../../middlewares/auth';

const usersRouter = factory.createApp();

// Middleware ตรวจสอบการล็อกอิน
usersRouter.use('/*', requireAuth);

// ดึงข้อมูลผู้ใช้งานปัจจุบัน
usersRouter.get('/me', (c) => {
  const user = c.get('user');
  return c.json(user);
});

export default usersRouter;
