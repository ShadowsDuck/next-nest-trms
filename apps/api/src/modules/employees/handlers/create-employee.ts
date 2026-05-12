import { EmployeeType } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { extractAuditContext } from '../../audit-logs';
import { createEmployeeService } from '../services/create-employee.service';

/**
 * Handler สำหรับการสร้างพนักงานใหม่
 */
export async function createEmployeeHandler(c: Context<HonoEnv>) {
  const auditContext = extractAuditContext(c);
  const body = c.req.valid('json' as never) as EmployeeType;
  try {
    const result = await createEmployeeService(body, auditContext);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
