import { db } from '../../../lib/db';

/**
 * ค้นหาพนักงานจากรายการรหัสพนักงาน สำหรับการออกรายงาน
 */
export async function getEmployeesByNosQuery(employeeNos: string[]) {
  return await db.employee.findMany({
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
}
