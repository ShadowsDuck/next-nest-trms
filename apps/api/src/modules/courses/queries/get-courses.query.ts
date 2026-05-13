import type { CourseQuery } from '@workspace/schemas';
import { db } from '../../../lib/db';
import { buildCourseWhereInput } from '../lib/course-where.builder';

/**
 * ค้นหาข้อมูลหลักสูตรพร้อมการแบ่งหน้าและนับจำนวนทั้งหมด
 */
export async function getCoursesQuery(queryDto: CourseQuery) {
  const { page, limit, includeEmployees } = queryDto;
  const where = buildCourseWhereInput(queryDto);

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      include: {
        tag: true,
        ...(includeEmployees
          ? {
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
            }
          : {}),
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startDate: 'desc' },
    }),
    db.course.count({ where }),
  ]);

  return { courses, total };
}
