import { z } from 'zod';

/**
 * Schema สำหรับตรวจสอบ Path Parameter ที่เป็น ID (UUID)
 */
export const idParamSchema = z.object({
  id: z.uuid('Invalid ID format. Must be a valid UUID.'),
});

/**
 * Schema สำหรับตรวจสอบ Path Parameter ที่ชื่อเฉพาะเจาะจง (ถ้ามี)
 */
export const commonParams = {
  id: z.uuid(),
  org_unit_id: z.uuid(),
};
