import {
  type CoursePaginationResponse,
  type CourseQuery,
  coursePaginationResponseSchema,
} from '@workspace/schemas'
import { fetcher } from '@/shared/lib/fetcher'
import { requireAdmin } from '@/shared/lib/session'
import { serializeCourseParams } from '../lib/search-params'

export async function getAllCoursesExport(
  params: CourseQuery,
  options?: { includeEmployees?: boolean }
): Promise<CoursePaginationResponse> {
  await requireAdmin()

  const baseQuery = serializeCourseParams(params)
  const separator = baseQuery.includes('?') ? '&' : '?'
  const endpoint = options?.includeEmployees
    ? `/api/courses${baseQuery}${separator}includeEmployees=true`
    : `/api/courses${baseQuery}`

  const data = await fetcher<CoursePaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return coursePaginationResponseSchema.parse(data)
}
