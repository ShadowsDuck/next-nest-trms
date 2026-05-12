import { EmployeeImportDryRunRequest } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { importDryRunService } from '../services/import-employees.service';

/**
 * Handler สำหรับตรวจสอบข้อมูลนำเข้าพนักงาน (Dry Run)
 */
export async function importDryRunHandler(c: Context<HonoEnv>) {
  const body = c.req.valid('json' as never) as EmployeeImportDryRunRequest;
  const result = await importDryRunService(body);
  return c.json(result, 200);
}
