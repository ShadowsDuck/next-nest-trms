import { CourseQuery } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getCoursesService } from '../services/get-courses.service';

/**
 * Handler สำหรับการดึงข้อมูลหลักสูตรทั้งหมด
 */
export async function getCoursesHandler(c: Context<HonoEnv>) {
  const user = c.get('user');
  const isExport = c.req.header('x-audit-intent') === 'export';
  const auditContext = isExport
    ? {
        userId: user.id,
        ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
        userAgent: c.req.header('user-agent') || 'Unknown',
      }
    : undefined;

  const query = c.req.valid('query' as never) as CourseQuery;
  try {
    const result = await getCoursesService(query, auditContext);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}
