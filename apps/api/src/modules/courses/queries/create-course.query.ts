import { Prisma } from '@workspace/database';
import { db } from '../../../lib/db';

/**
 * บันทึกข้อมูลหลักสูตรใหม่ลงฐานข้อมูล
 */
export async function createCourseQuery(
  data: Prisma.CourseUncheckedCreateInput,
  tx: Prisma.TransactionClient = db,
) {
  return await tx.course.create({
    data,
    include: {
      tag: true,
    },
  });
}
