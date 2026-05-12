import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth/auth';
import auditLogsRouter from './modules/audit-logs/router';
import coursesRouter from './modules/courses/router';
import employeesRouter from './modules/employees/router';
import healthRouter from './modules/health/router';
import organizationUnitsRouter from './modules/organization-units/router';
import summaryReportsRouter from './modules/summary-reports/router';
import tagsRouter from './modules/tags/router';
import usersRouter from './modules/users/router';

const app = new Hono();

// Global Middlewares
app.use(logger());
app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
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
export const routes = app
  .basePath('/api')
  .route('/health', healthRouter)
  .route('/users', usersRouter)
  .route('/tags', tagsRouter)
  .route('/courses', coursesRouter)
  .route('/employees', employeesRouter)
  .route('/organization-units', organizationUnitsRouter)
  .route('/audit-logs', auditLogsRouter)
  .route('/summary-reports', summaryReportsRouter);

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

const port = Number(process.env.PORT || 3000);

console.log(`API is running at http://localhost:${port}/api`);

serve({
  fetch: app.fetch,
  port,
});
