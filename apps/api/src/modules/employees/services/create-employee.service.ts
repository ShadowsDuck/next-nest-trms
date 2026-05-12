import { AuditAction } from '@workspace/database';
import type { EmployeeResponse, EmployeeType } from '@workspace/schemas';
import { db } from '../../../lib/db';
import {
  createAuditLog,
  createFailureLog,
} from '../../audit-logs/audit-logs.service';
import type { AuditLogContext } from '../../audit-logs/audit-logs.types';
import { validateEmployeeHierarchy } from '../../organization-units/organization-units.service';
import { formatEmployee } from '../lib/employees.mapper';
import { createEmployeeQuery } from '../queries/create-employee.query';

/**
 * จัดการการสร้างพนักงานใหม่ (Validation, Hierarchy Check, Audit)
 */
export async function createEmployeeService(
  createEmployeeDto: EmployeeType,
  auditLogContext: AuditLogContext,
): Promise<EmployeeResponse> {
  try {
    const existingEmployeeNo = await db.employee.findUnique({
      where: {
        employeeNo: createEmployeeDto.employeeNo,
      },
    });
    if (existingEmployeeNo) {
      throw new Error('รหัสพนักงานนี้มีอยู่แล้ว');
    }

    if (createEmployeeDto.idCardNo) {
      const existingIdCardNo = await db.employee.findUnique({
        where: {
          idCardNo: createEmployeeDto.idCardNo,
        },
      });
      if (existingIdCardNo) {
        throw new Error('รหัสประจำตัวประชาชนนี้มีอยู่แล้ว');
      }
    }

    const hireDate = createEmployeeDto.hireDate
      ? new Date(createEmployeeDto.hireDate)
      : null;

    if (hireDate && isNaN(hireDate.getTime())) {
      throw new Error('รูปแบบวันที่จ้างงานไม่ถูกต้อง');
    }
    if (hireDate && hireDate > new Date()) {
      throw new Error('วันที่จ้างงานต้องไม่เกินวันปัจจุบัน');
    }

    await validateEmployeeHierarchy({
      plantId: createEmployeeDto.plantId,
      buId: createEmployeeDto.buId,
      functionId: createEmployeeDto.functionId,
      divisionId: createEmployeeDto.divisionId,
      departmentId: createEmployeeDto.departmentId,
    });

    const employee = await db.$transaction(async (tx) => {
      const createdEmployee = await createEmployeeQuery(
        {
          ...createEmployeeDto,
          hireDate,
        },
        tx,
      );

      await createAuditLog(
        {
          action: AuditAction.Create,
          model: 'Employee',
          recordId: createdEmployee.id,
          newValues: createdEmployee,
          context: auditLogContext,
        },
        tx,
      );

      return createdEmployee;
    });

    return formatEmployee(employee);
  } catch (error) {
    await createFailureLog({
      model: 'Employee',
      newValues: {
        payload: toEmployeeAuditPayload(createEmployeeDto),
        error: toAuditErrorPayload(error),
      },
      context: auditLogContext,
    });
    throw error;
  }
}

/**
 * สร้าง payload สำหรับ audit log ของการสร้างพนักงาน
 */
function toEmployeeAuditPayload(
  createEmployeeDto: EmployeeType,
): Record<string, unknown> {
  return {
    employeeNo: createEmployeeDto.employeeNo,
    prefix: createEmployeeDto.prefix,
    firstName: createEmployeeDto.firstName,
    lastName: createEmployeeDto.lastName,
    idCardNo: createEmployeeDto.idCardNo ?? null,
    hireDate: createEmployeeDto.hireDate ?? null,
    jobLevel: createEmployeeDto.jobLevel,
    status: createEmployeeDto.status,
    plantId: createEmployeeDto.plantId,
    buId: createEmployeeDto.buId,
    functionId: createEmployeeDto.functionId,
    divisionId: createEmployeeDto.divisionId,
    departmentId: createEmployeeDto.departmentId,
  };
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
