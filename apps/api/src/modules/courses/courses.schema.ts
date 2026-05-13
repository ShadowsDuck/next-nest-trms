import type { CourseType as CourseSchemaType } from '@workspace/schemas';

/**
 * Payload สำหรับการสร้างหลักสูตรใหม่ (รองรับไฟล์แนบ)
 */
export type CreateCoursePayload = CourseSchemaType & {
  accreditationFile?: any;
  attendanceFile?: any;
};

/**
 * Metadata ของไฟล์ที่พร้อมอัปโหลด
 */
export type UploadableAttachment = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};
