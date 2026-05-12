import { EmployeeType } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { createEmployeeService } from '../services/create-employee.service';

/**
 * Handler สำหรับการสร้างพนักงานใหม่
 */
export async function createEmployeeHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const auditContext = {
    userId: user.id,
    ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
    userAgent: c.req.header('user-agent') || 'Unknown',
  };
  const body = c.req.valid('json' as never) as EmployeeType;
  try {
    const result = await createEmployeeService(body, auditContext);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
