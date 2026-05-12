import type { CourseResponse } from '@workspace/schemas';
import { formatCourse } from '../lib/courses.mapper';
import { getCoursesForReportQuery } from '../queries/get-courses-for-report.query';

/**
 * ดึงข้อมูลหลักสูตรสำหรับรายงาน
 */
export async function getCoursesForReportService(
  courseIds: string[],
): Promise<CourseResponse[]> {
  if (courseIds.length === 0) {
    return [];
  }

  const courses = await getCoursesForReportQuery(courseIds);

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
