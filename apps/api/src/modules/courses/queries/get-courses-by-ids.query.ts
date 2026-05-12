import { db } from '../../../lib/db';

/**
 * ค้นหาข้อมูลหลักสูตรตามรายการ ID (ใช้สำหรับออกรายงานหรือดึงข้อมูลแบบกลุ่ม)
 */
export async function getCoursesByIdsQuery(courseIds: string[]) {
  return await db.course.findMany({
    where: {
      id: { in: courseIds },
    },
    include: {
      tag: true,
      trainingRecords: {
        include: {
          employee: {
            include: {
              plant: true,
              businessUnit: true,
              orgFunction: true,
              division: true,
              department: true,
            },
          },
        },
      },
    },
  });
}
