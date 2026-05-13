import { env } from '@/env';
import { auth } from '@/lib/auth';
import { modules } from '@/modules';
import { factory } from '@/types/hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

const app = factory.createApp();

// Global Middlewares
app.use(logger());
app.use(
  '*',
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  }),
);

// Better Auth Handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Static files for uploads
app.use('/uploads/*', serveStatic({ root: './' }));

// API Routers — เชื่อมต่อ router ทุกตัวผ่าน basePath เพื่อให้ AppType ดึง type ได้ครบถ้วน
export const routes = app.basePath('/api').route('/', modules);

// Global Error Handler — จัดการ error ที่หลุดออกมาจาก handler ทุกตัวให้เป็น JSON เสมอ
app.onError((err, c) => {
  // ถ้าเป็น HTTPException ให้คืนค่าตามที่ Error กำหนดมา (เช่น 404, 401)
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  // กรณี Error อื่นๆ ให้ส่ง 500 กลับไป
  console.error('[API Error]', err);
  return c.json(
    {
      message: err.message || 'Internal Server Error',
      // ส่ง stack trace เฉพาะในโหมด development เท่านั้น
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    500,
  );
});

// Global Not Found Handler — จัดการ 404 ให้เป็น JSON แทน HTML default ของ Hono
app.notFound((c) => {
  return c.json({ message: `Route not found: ${c.req.path}` }, 404);
});

// Export AppType สำหรับใช้กับ Hono RPC Client ฝั่ง Frontend
export type AppType = typeof routes;

export default app;
