import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getEmployeeByNoService } from '../services/get-employee-by-no.service';

/**
 * Handler สำหรับดึงข้อมูลพนักงานรายบุคคล
 */
export async function getEmployeeByNoHandler(c: Context<HonoEnv>) {
  const employeeNo = c.req.param('employeeNo');
  try {
    const result = await getEmployeeByNoService(employeeNo);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 404);
  }
}
