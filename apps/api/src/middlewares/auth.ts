import { createMiddleware } from 'hono/factory';
import { auth } from '../auth/auth';

// Middleware สำหรับตรวจสอบ Session และฝัง User ลงใน Context
export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  c.set('session', session.session);
  await next();
});
