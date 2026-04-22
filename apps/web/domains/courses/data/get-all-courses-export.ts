import {
  type CoursePaginationResponse,
  type CourseQuery,
  coursePaginationResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'
import { serializeCourseParams } from '../lib/search-params'

export async function getAllCoursesExport(
  params: CourseQuery,
  options?: { includeEmployees?: boolean }
): Promise<CoursePaginationResponse> {
  const baseQuery = serializeCourseParams(params)
  const separator = baseQuery.includes('?') ? '&' : '?'
  const endpoint = options?.includeEmployees
    ? `/api/courses${baseQuery}${separator}includeEmployees=true`
    : `/api/courses${baseQuery}`

  const data = await api.get<CoursePaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return coursePaginationResponseSchema.parse(data)
}
