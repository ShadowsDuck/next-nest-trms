import type { CourseQuery } from '@workspace/schemas'
import { getAllCoursesExport } from '@/domains/courses/data/get-all-courses-export'
import { triggerCsvDownload } from '@/shared/components/niko-table/filters/table-export-button'
import {
  COURSE_EXPORT_HEADER,
  buildCourseSummaryRow,
} from './export-course-utils'

export async function exportCoursesCSV({
  params,
  filename,
  selectedCourseIds,
}: {
  params: CourseQuery
  filename: string
  selectedCourseIds?: string[]
}) {
  const response = await getAllCoursesExport(params)
  const selectedSet =
    selectedCourseIds && selectedCourseIds.length > 0
      ? new Set(selectedCourseIds)
      : null

  const courses =
    selectedSet == null
      ? response.data
      : response.data.filter((course) => selectedSet.has(course.id))

  const rows = [
    COURSE_EXPORT_HEADER.join(','),
    ...courses.map((course) => buildCourseSummaryRow(course)),
  ]

  triggerCsvDownload(filename, rows)
}
