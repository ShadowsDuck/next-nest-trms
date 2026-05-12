import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './env';
import { auth } from './lib/auth';
import { modules } from './modules';
import { HonoEnv } from './types/hono';

const app = new Hono<HonoEnv>();

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
  console.error('[API Error]', err);
  return c.json({ message: err.message || 'Internal Server Error' }, 500);
});

// Global Not Found Handler — จัดการ 404 ให้เป็น JSON แทน HTML default ของ Hono
app.notFound((c) => {
  return c.json({ message: `Route not found: ${c.req.path}` }, 404);
});

// Export AppType สำหรับใช้กับ Hono RPC Client ฝั่ง Frontend
export type AppType = typeof routes;

export default app;
