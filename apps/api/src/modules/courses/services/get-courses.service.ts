import { AuditAction } from '@workspace/database';
import type { CoursePaginationResponse, CourseQuery } from '@workspace/schemas';
import type { AuditLogContext } from '../../audit-logs/audit-logs.types';
import {
  createAuditLog,
  createFailureLog,
} from '../../audit-logs/services/audit-logs-write.service';
import { formatCourse } from '../lib/courses.mapper';
import { getCoursesQuery } from '../queries/get-courses.query';

/**
 * จัดการการดึงข้อมูลหลักสูตรทั้งหมดพร้อม Audit Log
 */
export async function getCoursesService(
  queryDto: CourseQuery,
  auditLogContext?: AuditLogContext,
): Promise<CoursePaginationResponse> {
  const { page, limit, includeEmployees } = queryDto;

  try {
    const { courses, total } = await getCoursesQuery(queryDto);

    const response = {
      data: courses.map((course) => formatCourse(course)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    if (auditLogContext) {
      await createAuditLog({
        action: AuditAction.Export,
        model: 'Course',
        newValues: {
          filters: queryDto,
          exportedCount: response.data.length,
          includeEmployees,
        },
        context: auditLogContext,
      });
    }

    return response;
  } catch (error) {
    if (auditLogContext) {
      await createFailureLog({
        model: 'Course',
        newValues: {
          filters: queryDto,
          includeEmployees,
          error: toAuditErrorPayload(error),
        },
        context: auditLogContext,
      });
    }

    throw error;
  }
}

/**
 * สรุปข้อผิดพลาดให้อยู่ในรูปแบบ JSON
 */
function toAuditErrorPayload(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: 'UnknownError',
    message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
  };
}
