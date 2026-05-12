import { zValidator } from '@hono/zod-validator';
import { courseQuerySchema } from '@workspace/schemas';
import { factory } from '../../lib/factory';
import { requireAuth } from '../../middlewares/auth';
import {
  type CreateCoursePayload,
  createCourse,
  findAllCourses,
  toUploadableAttachment,
} from './courses.service';

const coursesRouter = factory.createApp();

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

coursesRouter.use('/*', requireAuth);

// ตรวจชนิดและขนาดไฟล์แนบให้เป็นไปตามข้อกำหนดก่อนส่งเข้า service
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

// สร้างหลักสูตรใหม่
coursesRouter.post('/', async (c) => {
  const user = c.get('user');
  const auditContext = {
    userId: user.id,
    ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
    userAgent: c.req.header('user-agent') || 'Unknown',
  };

  const body = await c.req.parseBody();

  // แปลง parseBody() string fields ให้กลับเป็น types ตาม DTO ให้ถูกต้อง (ส่วนใหญ่น่าจะเป็น form-data)
  // แต่การใช้ parseBody() สำหรับ FormData จะได้ File objects ออกมาด้วย
  const payload = { ...body } as unknown as CreateCoursePayload;

  // ถ้ามีการแปลงค่า number หรือ boolean อาจต้องพิจารณา parse จาก string เพิ่มเติม
  if (typeof payload.expense === 'string')
    payload.expense = Number(payload.expense);
  if (typeof payload.duration === 'string')
    payload.duration = Number(payload.duration);

  // Convert File objects to Buffer for the service
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

    const result = await createCourse(payload, auditContext);
    return c.json(result, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

// ดึงข้อมูลหลักสูตรทั้งหมด
coursesRouter.get('/', zValidator('query', courseQuerySchema), async (c) => {
  const user = c.get('user');
  const isExport = c.req.header('x-audit-intent') === 'export';
  const auditContext = isExport
    ? {
        userId: user.id,
        ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
        userAgent: c.req.header('user-agent') || 'Unknown',
      }
    : undefined;

  const query = c.req.valid('query');
  try {
    const result = await findAllCourses(query, auditContext);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

export default coursesRouter;
