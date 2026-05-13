import { AuditAction } from '@workspace/database';
import type {
  EmployeePaginationResponse,
  EmployeeQuery,
} from '@workspace/schemas';
import type { AuditLogContext } from '../../audit-logs/audit-logs.types';
import {
  createAuditLog,
  createFailureLog,
} from '../../audit-logs/services/audit-logs-write.service';
import { formatEmployee } from '../lib/employees.mapper';
import { getEmployeesQuery } from '../queries/get-employees.query';

/**
 * จัดการการดึงข้อมูลพนักงานทั้งหมดพร้อม Audit Log
 */
export async function getEmployeesService(
  queryDto: EmployeeQuery,
  auditLogContext?: AuditLogContext,
): Promise<EmployeePaginationResponse> {
  const { page, limit, includeTrainingRecords } = queryDto;

  try {
    const { employees, total } = await getEmployeesQuery(queryDto);

    const response = {
      data: employees.map((employee) => formatEmployee(employee)),
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
        model: 'Employee',
        newValues: {
          filters: queryDto,
          exportedCount: response.data.length,
          includeTrainingRecords,
        },
        context: auditLogContext,
      });
    }

    return response;
  } catch (error) {
    if (auditLogContext) {
      await createFailureLog({
        model: 'Employee',
        newValues: {
          filters: queryDto,
          includeTrainingRecords,
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
