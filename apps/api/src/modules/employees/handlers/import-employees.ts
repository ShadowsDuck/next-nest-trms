import { EmployeeImportRequest } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { importEmployeesService } from '../import';

/**
 * Handler สำหรับการนำเข้าพนักงาน
 */
export async function importEmployeesHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const auditContext = {
    userId: user.id,
    ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
    userAgent: c.req.header('user-agent') || 'Unknown',
  };
  const body = c.req.valid('json' as never) as EmployeeImportRequest;
  try {
    const result = await importEmployeesService(body, auditContext);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
