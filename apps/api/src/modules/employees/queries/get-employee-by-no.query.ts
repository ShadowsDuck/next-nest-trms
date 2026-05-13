import { db } from '../../../lib/db';

/**
 * ค้นหาข้อมูลพนักงานรายบุคคลจากรหัสพนักงาน
 */
export async function getEmployeeByNoQuery(employeeNo: string) {
  return await db.employee.findUnique({
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
}
