import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { extractAuditContext } from '../../audit-logs';
import { CreateCoursePayload } from '../courses.schema';
import {
  createCourseService,
  toUploadableAttachment,
} from '../services/create-course.service';

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

/**
 * Handler สำหรับการสร้างหลักสูตรใหม่
 */
export async function createCourseHandler(c: Context<HonoEnv>) {
  const auditContext = extractAuditContext(c);

  const body = await c.req.parseBody();

  const payload = { ...body } as unknown as CreateCoursePayload;

  if (typeof payload.expense === 'string')
    payload.expense = Number(payload.expense);
  if (typeof payload.duration === 'string')
    payload.duration = Number(payload.duration);

  const toBufferFile = async (fileObj: any) => {
    if (fileObj && fileObj instanceof File) {
      return {
        originalname: fileObj.name,
        mimetype: fileObj.type,
        size: fileObj.size,
        buffer: Buffer.from(await fileObj.arrayBuffer()),
      };
    }
    return undefined;
  };

  payload.accreditationFile = await toBufferFile(body['accreditationFile']);
  payload.attendanceFile = await toBufferFile(body['attendanceFile']);

  try {
    validateAttachmentFile(
      toUploadableAttachment(payload.accreditationFile),
      'ไฟล์รับรอง',
    );
    validateAttachmentFile(
      toUploadableAttachment(payload.attendanceFile),
      'ไฟล์รายชื่อผู้เข้าอบรม',
    );

    const result = await createCourseService(payload, auditContext);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
}

/**
 * ตรวจชนิดและขนาดไฟล์แนบ
 */
function validateAttachmentFile(
  file: ReturnType<typeof toUploadableAttachment>,
  fieldLabel: string,
): void {
  if (!file) {
    return;
  }

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
    throw new Error(
      `${fieldLabel}รองรับเฉพาะ PDF, JPG, PNG, XLS, XLSX และ CSV`,
    );
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error(`${fieldLabel}ต้องมีขนาดไม่เกิน 10 MB`);
  }
}
