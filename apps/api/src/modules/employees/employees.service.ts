import { AuditAction } from '@workspace/database';
import type {
  EmployeeDetailResponse,
  EmployeePaginationResponse,
  EmployeeQuery,
  EmployeeResponse,
  EmployeeType,
} from '@workspace/schemas';
import { db } from '../../lib/db';
import {
  createAuditLog,
  createFailureLog,
} from '../audit-logs/audit-logs.service';
import type { AuditLogContext } from '../audit-logs/audit-logs.types';
import { validateEmployeeHierarchy } from '../organization-units/organization-units.service';
import { buildEmployeeWhereInput } from './lib/employee-where.builder';
import { formatEmployee } from './lib/employees.mapper';

export type CreateEmployeePayload = EmployeeType;

// สร้างพนักงานใหม่ 1 รายการ พร้อมตรวจข้อมูลซ้ำและความถูกต้องของ chain หน่วยงาน
export async function createEmployee(
  createEmployeeDto: CreateEmployeePayload,
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
      const createdEmployee = await tx.employee.create({
        data: {
          ...createEmployeeDto,
          hireDate,
        },
        include: {
          plant: true,
          businessUnit: true,
          orgFunction: true,
          division: true,
          department: true,
          trainingRecords: {
            include: {
              course: {
                include: {
                  tag: true,
                },
              },
            },
          },
        },
      });

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

// ดึงข้อมูลพนักงานแบบแบ่งหน้า รองรับตัวกรอง และเลือกว่าจะ include training records หรือไม่
export async function findAllEmployees(
  queryDto: EmployeeQuery,
  auditLogContext?: AuditLogContext,
): Promise<EmployeePaginationResponse> {
  const { page, limit, includeTrainingRecords } = queryDto;
  const where = buildEmployeeWhereInput(queryDto);

  try {
    const [employees, total] = await Promise.all([
      db.employee.findMany({
        include: {
          plant: true,
          businessUnit: true,
          orgFunction: true,
          division: true,
          department: true,
          ...(includeTrainingRecords
            ? {
                trainingRecords: {
                  include: {
                    course: {
                      include: {
                        tag: true,
                      },
                    },
                  },
                },
              }
            : {}),
        },
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          employeeNo: 'asc',
        },
      }),
      db.employee.count({ where }),
    ]);

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

// ดึงรายละเอียดพนักงาน 1 รายการตาม employeeNo พร้อมข้อมูลหน่วยงานและประวัติการอบรม
export async function findOneEmployeeByNo(
  employeeNo: string,
): Promise<EmployeeDetailResponse> {
  const employee = await db.employee.findUnique({
    where: {
      employeeNo,
    },
    include: {
      plant: true,
      businessUnit: true,
      orgFunction: true,
      division: true,
      department: true,
      trainingRecords: {
        include: {
          course: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          course: {
            endDate: 'desc',
          },
        },
      },
    },
  });

  if (!employee) {
    throw new Error('ไม่พบข้อมูลพนักงานที่ต้องการ');
  }

  return formatEmployee(employee);
}

// ดึงพนักงานตาม employeeNo หลายรายการ โดยคงลำดับผลลัพธ์ตาม input เดิม
export async function findByEmployeeNosForReport(
  employeeNos: string[],
): Promise<EmployeeResponse[]> {
  if (employeeNos.length === 0) {
    return [];
  }

  const employees = await db.employee.findMany({
    where: {
      employeeNo: { in: employeeNos },
    },
    include: {
      plant: true,
      businessUnit: true,
      orgFunction: true,
      division: true,
      department: true,
      trainingRecords: {
        include: {
          course: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
  });

  const orderMap = new Map(
    employeeNos.map((employeeNo, index) => [employeeNo, index] as const),
  );

  return employees
    .map((employee) => formatEmployee(employee))
    .sort(
      (a, b) =>
        (orderMap.get(a.employeeNo) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b.employeeNo) ?? Number.MAX_SAFE_INTEGER),
    );
}

// สร้าง payload สำหรับ audit log ของการสร้างพนักงานจากข้อมูล request
function toEmployeeAuditPayload(
  createEmployeeDto: CreateEmployeePayload,
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

// สรุปข้อผิดพลาดให้อยู่ในรูปแบบ JSON ที่อ่านย้อนหลังได้ง่าย
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
