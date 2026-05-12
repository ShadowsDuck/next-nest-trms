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
// serveStatic in Node resolves relative to where the node process is running
app.use('/uploads/*', serveStatic({ root: './' }));

// API Routers
const api = app.basePath('/api');

api.route('/health', healthRouter);
api.route('/users', usersRouter);
api.route('/tags', tagsRouter);
api.route('/courses', coursesRouter);
api.route('/employees', employeesRouter);
api.route('/organization-units', organizationUnitsRouter);
api.route('/audit-logs', auditLogsRouter);
api.route('/summary-reports', summaryReportsRouter);

const port = Number(process.env.PORT || 3000);

console.log(`API is running at http://localhost:${port}/api`);

serve({
  fetch: app.fetch,
  port,
});
