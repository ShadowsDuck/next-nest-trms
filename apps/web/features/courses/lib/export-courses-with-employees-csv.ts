import type { CourseQuery } from '@workspace/schemas'
import { getAllCoursesExport } from '@/domains/courses'
import { triggerCsvDownload } from '@/shared/lib/csv'
import {
  COURSE_EXPORT_HEADER,
  COURSE_PARTICIPANT_HEADER,
  buildCourseSummaryRow,
  buildParticipantRows,
} from './export-course-utils'

export async function exportCoursesWithEmployeesCSV({
  params,
  filename,
  selectedCourseIds,
}: {
  params: CourseQuery
  filename: string
  selectedCourseIds?: string[]
}) {
  const response = await getAllCoursesExport(params, { includeEmployees: true })
  const selectedSet =
    selectedCourseIds && selectedCourseIds.length > 0
      ? new Set(selectedCourseIds)
      : null

  const courses =
    selectedSet == null
      ? response.data
      : response.data.filter((course) => selectedSet.has(course.id))

  const rows: string[] = []

  courses.forEach((course, index) => {
    if (index > 0) {
      rows.push('')
      rows.push('')
    }

    rows.push(COURSE_EXPORT_HEADER.join(','))
    rows.push(buildCourseSummaryRow(course))
    rows.push('')
    rows.push(COURSE_PARTICIPANT_HEADER.join(','))

    const participantRows = buildParticipantRows(course)

    if (participantRows.length === 0) {
      rows.push(',,,,,')
      return
    }

    rows.push(...participantRows)
  })

  triggerCsvDownload(filename, rows)
}

