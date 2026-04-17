import {
  type CoursePaginationResponse,
  type CourseQuery,
  coursePaginationResponseSchema,
} from '@workspace/schemas'
import { fetcher } from '@/lib/fetcher'
import { serializeCourseParams } from '../lib/search-params'

export async function getAllCourses(
  params: CourseQuery
): Promise<CoursePaginationResponse> {
  const endpoint = `/api/courses${serializeCourseParams(params)}`

  const data = await fetcher<CoursePaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return coursePaginationResponseSchema.parse(data)
}
