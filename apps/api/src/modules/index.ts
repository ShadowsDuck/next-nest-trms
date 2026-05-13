import { factory } from '@/types/hono';
import auditLogsRouter from './audit-logs';
import coursesRouter from './courses';
import employeesRouter from './employees';
import healthRouter from './health';
import organizationUnitsRouter from './organization-units';
import summaryReportsRouter from './summary-reports';
import tagsRouter from './tags';
import usersRouter from './users';

/**
 * รวม Router ของทุก Domain Module เข้าด้วยกัน
 */
export const modules = factory
  .createApp()
  .route('/health', healthRouter)
  .route('/users', usersRouter)
  .route('/tags', tagsRouter)
  .route('/courses', coursesRouter)
  .route('/employees', employeesRouter)
  .route('/organization-units', organizationUnitsRouter)
  .route('/audit-logs', auditLogsRouter)
  .route('/summary-reports', summaryReportsRouter);

export type AppType = typeof modules;
