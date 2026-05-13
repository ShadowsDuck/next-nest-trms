import type { CourseResponse } from '@workspace/schemas';
import { formatCourse } from '../lib/courses.mapper';
import { getCoursesByIdsQuery } from '../queries/get-courses-by-ids.query';

/**
 * ดึงข้อมูลหลักสูตรตามรายการ ID พร้อมจัดรูปแบบ (ใช้สำหรับออกรายงานหรือดึงข้อมูลแบบกลุ่ม)
 */
export async function getCoursesByIdsService(
  courseIds: string[],
): Promise<CourseResponse[]> {
  if (courseIds.length === 0) {
    return [];
  }

  const courses = await getCoursesByIdsQuery(courseIds);

  const orderMap = new Map(
    courseIds.map((courseId, index) => [courseId, index] as const),
  );

  return courses
    .map((course) => formatCourse(course))
    .sort(
      (a, b) =>
        (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
}
