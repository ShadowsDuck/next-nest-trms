import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth.middleware';
import { HonoEnv } from '../../types/hono';
import { getMeHandler } from './handlers/get-me';

const usersRouter = new Hono<HonoEnv>();

// Middleware ตรวจสอบการล็อกอิน
usersRouter.use('/*', requireAuth);

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูลผู้ใช้งาน
 */
usersRouter.get('/me', getMeHandler);

export default usersRouter;
