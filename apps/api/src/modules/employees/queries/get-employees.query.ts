import type { EmployeeQuery } from '@workspace/schemas';
import { db } from '../../../lib/db';
import { buildEmployeeWhereInput } from '../lib/employee-where.builder';

/**
 * ค้นหาข้อมูลพนักงานพร้อมการแบ่งหน้าและนับจำนวนทั้งหมด
 */
export async function getEmployeesQuery(queryDto: EmployeeQuery) {
  const { page, limit, includeTrainingRecords } = queryDto;
  const where = buildEmployeeWhereInput(queryDto);

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

  return { employees, total };
}
