import {
  type CoursePaginationResponse,
  type CourseQuery,
  coursePaginationResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'
import { serializeCourseParams } from '../lib/search-params'

export async function getAllCourses(
  params: CourseQuery
): Promise<CoursePaginationResponse> {
  const endpoint = `/api/courses${serializeCourseParams(params)}`

  const data = await api.get<CoursePaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return coursePaginationResponseSchema.parse(data)
}
