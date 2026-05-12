import { zValidator } from '@hono/zod-validator';
import {
  employeeImportDryRunRequestSchema,
  employeeImportRequestSchema,
  employeeQuerySchema,
  employeeSchema,
} from '@workspace/schemas';
import { Hono } from 'hono';
import { requireAuth } from '../../middlewares/auth';
import { importDryRun, importEmployees } from './employee-import.service';
import {
  createEmployee,
  findAllEmployees,
  findOneEmployeeByNo,
} from './employees.service';

const employeesRouter = new Hono<{
  Variables: { user: { id: string; [key: string]: any }; session: any };
}>();

employeesRouter.use('/*', requireAuth);

// ตรวจสอบข้อมูลนำเข้าพนักงานจาก CSV (ยังไม่บันทึก)
employeesRouter.post(
  '/import/dry-run',
  zValidator('json', employeeImportDryRunRequestSchema),
  async (c) => {
    // ต้องตรวจสอบสิทธิ์: employee ['import'] ด้วยในภายหลังเมื่อรวมสิทธิ์
    const body = c.req.valid('json');
    const result = await importDryRun(body);
    return c.json(result, 200);
  },
);

// นำเข้าพนักงานจาก CSV แบบ partial success
employeesRouter.post(
  '/import',
  zValidator('json', employeeImportRequestSchema),
  async (c) => {
    const user = c.get('user');
    const _session = c.get('session'); // เก็บไว้เผื่อต้องการข้อมูลเซสชัน
    const auditContext = {
      userId: user.id,
      ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
      userAgent: c.req.header('user-agent') || 'Unknown',
    };
    const body = c.req.valid('json');
    try {
      const result = await importEmployees(body, auditContext);
      return c.json(result, 201);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

// สร้างพนักงานใหม่
employeesRouter.post('/', zValidator('json', employeeSchema), async (c) => {
  const user = c.get('user');
  const auditContext = {
    userId: user.id,
    ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
    userAgent: c.req.header('user-agent') || 'Unknown',
  };
  const body = c.req.valid('json');
  try {
    const result = await createEmployee(body, auditContext);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

// ดึงข้อมูลพนักงานทั้งหมด
employeesRouter.get(
  '/',
  zValidator('query', employeeQuerySchema),
  async (c) => {
    const user = c.get('user');
    const isExport = c.req.header('x-audit-intent') === 'export';
    const auditContext = isExport
      ? {
          userId: user.id,
          ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
          userAgent: c.req.header('user-agent') || 'Unknown',
        }
      : undefined;

    const query = c.req.valid('query');
    try {
      const result = await findAllEmployees(query, auditContext);
      return c.json(result, 200);
    } catch (error) {
      return c.json({ message: (error as Error).message }, 400);
    }
  },
);

// ดึงรายละเอียดพนักงานตามรหัสพนักงาน
employeesRouter.get('/:employeeNo', async (c) => {
  const employeeNo = c.req.param('employeeNo');
  try {
    const result = await findOneEmployeeByNo(employeeNo);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
});

export default employeesRouter;
