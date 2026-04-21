import type { CourseQuery } from '@workspace/schemas'

export const COURSES_QUERY_KEY = 'courses'
export const COURSE_FILTER_OPTIONS_QUERY_KEY = [
  'course-filter-options',
] as const

export function buildCoursesQueryKey(params: CourseQuery) {
  const type = params.type ?? []
  const tagName = params.tagName ?? []
  const dateRange = params.dateRange ?? []
  const durationRange = params.durationRange ?? []
  const accreditationStatus = params.accreditationStatus ?? []

  return [
    COURSES_QUERY_KEY,
    params.page,
    params.limit,
    params.search,
    type.join(','),
    tagName.join(','),
    dateRange.join(','),
    durationRange.join(','),
    accreditationStatus.join(','),
  ] as const
}

