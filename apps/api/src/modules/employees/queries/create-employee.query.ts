import { Prisma } from '@workspace/database';
import { db } from '../../../lib/db';

/**
 * บันทึกข้อมูลพนักงานใหม่ลงฐานข้อมูล
 */
export async function createEmployeeQuery(
  data: Prisma.EmployeeUncheckedCreateInput,
  tx: Prisma.TransactionClient = db,
) {
  return await tx.employee.create({
    data,
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
}
