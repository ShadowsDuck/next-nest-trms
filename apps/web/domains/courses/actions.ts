'use server'

import {
  type CourseResponse,
  type CourseType,
  courseResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'

// สร้างหลักสูตรใหม่ผ่าน API และตรวจรูปแบบข้อมูลผลลัพธ์ให้ตรง schema
export async function createCourse(
  payload: CourseType
): Promise<CourseResponse> {
  const data = await api.post<CourseResponse>('/api/courses', payload)

  return courseResponseSchema.parse(data)
}
