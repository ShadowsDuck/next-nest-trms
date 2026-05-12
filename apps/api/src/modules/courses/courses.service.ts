import type { CourseResponse, CourseQuery, CoursePaginationResponse } from '@workspace/schemas';
import { AuditAction } from '@workspace/database';
import { db } from '../../lib/db';
import {
  createAuditLog,
  createFailureLog,
} from '../audit-logs/audit-logs.service';
import type { AuditLogContext } from '../audit-logs/audit-logs.types';
import type {  } from '@workspace/schemas';
import { buildCourseWhereInput } from './lib/course-where.builder';
import { formatCourse } from './lib/courses.mapper';
import type { CourseAttachmentUploadResult } from './storage/course-attachment-storage.contract';
import {
  deleteAttachment,
  uploadAttachment,
} from './storage/onedrive-course-attachment-storage.service';

type CreateCoursePayload = any; // Will be typed correctly from the router payload

type UploadableAttachment = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

// สร้างหลักสูตรใหม่ พร้อมตรวจความถูกต้องของวันที่ เวลา และหมวดหมู่
export async function createCourse(
  createCourseDto: CreateCoursePayload,
  auditLogContext: AuditLogContext,
): Promise<CourseResponse> {
  const attachmentPayload = createCourseDto as CreateCoursePayload &
    Record<string, unknown>;
  const accreditationFile = toUploadableAttachment(
    attachmentPayload.accreditationFile,
  );
  const attendanceFile = toUploadableAttachment(
    attachmentPayload.attendanceFile,
  );
  const uploadedFiles: CourseAttachmentUploadResult[] = [];

  try {
    const tag = await db.tag.findUnique({
      where: { id: createCourseDto.tagId },
    });
    if (!tag) {
      throw new Error('ไม่พบหมวดหมู่หลักสูตรที่ระบุ');
    }

    const startDate = new Date(createCourseDto.startDate);
    const endDate = new Date(createCourseDto.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('รูปแบบวันที่ไม่ถูกต้อง');
    }
    if (startDate.getTime() > endDate.getTime()) {
      throw new Error('วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด');
    }

    const startTime = parseTime(createCourseDto.startTime ?? null);
    const endTime = parseTime(createCourseDto.endTime ?? null);
    if (startDate.getTime() === endDate.getTime() && startTime && endTime) {
      if (startTime.getTime() > endTime.getTime()) {
        throw new Error(
          'เวลาเริ่มต้องไม่มากกว่าเวลาสิ้นสุดเมื่อจัดอบรมวันเดียวกัน',
        );
      }
    }

    const [accreditationUpload, attendanceUpload] =
      await uploadCourseAttachments(
        accreditationFile,
        attendanceFile,
        uploadedFiles,
        createCourseDto.title,
        startDate,
      );

    const created = await db.$transaction(async (tx) => {
      const createdCourse = await tx.course.create({
        data: {
          title: createCourseDto.title,
          type: createCourseDto.type,
          startDate,
          endDate,
          startTime,
          endTime,
          duration: createCourseDto.duration,
          lecturer: createCourseDto.lecturer ?? null,
          institute: createCourseDto.institute ?? null,
          expense: createCourseDto.expense,
          accreditationStatus: createCourseDto.accreditationStatus,
          accreditationFilePath:
            accreditationUpload?.filePath ??
            accreditationUpload?.webViewLink ??
            createCourseDto.accreditationFilePath ??
            toFallbackFilePath(accreditationFile),
          attendanceFilePath:
            attendanceUpload?.filePath ??
            attendanceUpload?.webViewLink ??
            createCourseDto.attendanceFilePath ??
            toFallbackFilePath(attendanceFile),
          tagId: createCourseDto.tagId,
        },
        include: {
          tag: true,
        },
      });

      await createAuditLog(
        {
          action: AuditAction.Create,
          model: 'Course',
          recordId: createdCourse.id,
          newValues: createdCourse,
          context: auditLogContext,
        },
        tx,
      );

      return createdCourse;
    });

    return formatCourse(created);
  } catch (error) {
    await rollbackUploadedFiles(uploadedFiles);
    await createFailureLog({
      model: 'Course',
      newValues: {
        payload: toCourseAuditPayload(
          createCourseDto,
          accreditationFile,
          attendanceFile,
        ),
        error: toAuditErrorPayload(error),
      },
      context: auditLogContext,
    });
    throw error;
  }
}

export async function findAllCourses(
  queryDto: CourseQuery,
  auditLogContext?: AuditLogContext,
): Promise<CoursePaginationResponse> {
  const { page, limit, includeEmployees } = queryDto;
  const where = buildCourseWhereInput(queryDto);

  try {
    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          tag: true,
          ...(includeEmployees
            ? {
                trainingRecords: {
                  include: {
                    employee: {
                      include: {
                        plant: true,
                        businessUnit: true,
                        orgFunction: true,
                        division: true,
                        department: true,
                      },
                    },
                  },
                },
              }
            : {}),
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      db.course.count({ where }),
    ]);

    const response = {
      data: courses.map((course) => formatCourse(course)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    if (auditLogContext) {
      await createAuditLog({
        action: AuditAction.Export,
        model: 'Course',
        newValues: {
          filters: queryDto,
          exportedCount: response.data.length,
          includeEmployees,
        },
        context: auditLogContext,
      });
    }

    return response;
  } catch (error) {
    if (auditLogContext) {
      await createFailureLog({
        model: 'Course',
        newValues: {
          filters: queryDto,
          includeEmployees,
          error: toAuditErrorPayload(error),
        },
        context: auditLogContext,
      });
    }

    throw error;
  }
}

export async function findByCourseIdsForReport(
  courseIds: string[],
): Promise<CourseResponse[]> {
  if (courseIds.length === 0) {
    return [];
  }

  const courses = await db.course.findMany({
    where: {
      id: { in: courseIds },
    },
    include: {
      tag: true,
      trainingRecords: {
        include: {
          employee: {
            include: {
              plant: true,
              businessUnit: true,
              orgFunction: true,
              division: true,
              department: true,
            },
          },
        },
      },
    },
  });

  const orderMap = new Map(
    courseIds.map((courseId, index) => [courseId, index] as const),
  );

  return courses
    .map((course) => formatCourse(course))
    .sort(
      (a, b) =>
        (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
}

// แปลงค่าเวลา HH:mm:ss ให้เป็น Date สำหรับฟิลด์ @db.Time
function parseTime(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const timePattern = /^\d{2}:\d{2}:\d{2}$/;
  if (!timePattern.test(value)) {
    throw new Error('รูปแบบเวลาไม่ถูกต้อง');
  }

  const parsed = new Date(`1970-01-01T${value}.000Z`);
  if (isNaN(parsed.getTime())) {
    throw new Error('รูปแบบเวลาไม่ถูกต้อง');
  }

  return parsed;
}

// แปลงข้อมูลไฟล์ที่อาจถูกส่งมาจาก multipart ให้เป็นรูปแบบที่พร้อมอัปโหลด
export function toUploadableAttachment(
  value: unknown,
): UploadableAttachment | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybeFile = value as Partial<UploadableAttachment>;
  if (
    typeof maybeFile.originalname !== 'string' ||
    typeof maybeFile.mimetype !== 'string' ||
    typeof maybeFile.size !== 'number' ||
    !Buffer.isBuffer(maybeFile.buffer)
  ) {
    return null;
  }

  return {
    // แก้ปัญหา multer decode ชื่อไฟล์ด้วย latin1 ทำให้ภาษาไทยแสดงผลผิด
    originalname: Buffer.from(maybeFile.originalname, 'latin1').toString(
      'utf8',
    ),
    mimetype: maybeFile.mimetype,
    size: maybeFile.size,
    buffer: maybeFile.buffer,
  };
}

// อัปโหลดไฟล์แนบตามประเภทที่ระบุ และบันทึกไฟล์ที่อัปโหลดสำเร็จไว้สำหรับ rollback
async function uploadOptionalAttachment(
  kind: 'accreditation' | 'attendance',
  file: UploadableAttachment | null,
  uploadedFiles: CourseAttachmentUploadResult[],
  courseName: string,
  startDate: Date | string,
): Promise<CourseAttachmentUploadResult | null> {
  if (!file) {
    return null;
  }

  const uploaded = await uploadAttachment({
    kind,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    buffer: file.buffer,
    courseName,
    startDate,
  });
  uploadedFiles.push(uploaded);

  return uploaded;
}

// อัปโหลดไฟล์หลักสูตรทั้งหมดพร้อมจัดการ rollback เมื่ออัปโหลดไม่สำเร็จ
async function uploadCourseAttachments(
  accreditationFile: UploadableAttachment | null,
  attendanceFile: UploadableAttachment | null,
  uploadedFiles: CourseAttachmentUploadResult[],
  courseName: string,
  startDate: Date,
): Promise<
  [CourseAttachmentUploadResult | null, CourseAttachmentUploadResult | null]
> {
  try {
    // อัปโหลดทั้ง 2 ไฟล์พร้อมกันเพื่อลดเวลารวม
    return await Promise.all([
      uploadOptionalAttachment(
        'accreditation',
        accreditationFile,
        uploadedFiles,
        courseName,
        startDate,
      ),
      uploadOptionalAttachment(
        'attendance',
        attendanceFile,
        uploadedFiles,
        courseName,
        startDate,
      ),
    ]);
  } catch (error) {
    await rollbackUploadedFiles(uploadedFiles);
    throw error;
  }
}

// ลบไฟล์ที่อัปโหลดแล้วทั้งหมดเมื่อเกิดข้อผิดพลาดภายหลัง เพื่อคงพฤติกรรมแบบ atomic
async function rollbackUploadedFiles(
  uploadedFiles: CourseAttachmentUploadResult[],
): Promise<void> {
  for (const file of uploadedFiles) {
    try {
      await deleteAttachment({ fileId: file.fileId });
    } catch {
      console.warn(`Rollback attachment failed: ${file.fileId}`);
    }
  }

  uploadedFiles.length = 0;
}

// สร้างค่า path สำรองจากชื่อไฟล์ เมื่อยังไม่มี path ที่คืนกลับจาก provider
function toFallbackFilePath(file: UploadableAttachment | null): string | null {
  if (!file) {
    return null;
  }

  return `uploads/courses/${file.originalname}`;
}

// สร้าง payload สำหรับ audit log โดยตัดข้อมูลไฟล์ binary ออกและเก็บเฉพาะ metadata ที่จำเป็น
function toCourseAuditPayload(
  createCourseDto: CreateCoursePayload,
  accreditationFile: UploadableAttachment | null,
  attendanceFile: UploadableAttachment | null,
): Record<string, unknown> {
  return {
    title: createCourseDto.title,
    type: createCourseDto.type,
    startDate: createCourseDto.startDate,
    endDate: createCourseDto.endDate,
    startTime: createCourseDto.startTime ?? null,
    endTime: createCourseDto.endTime ?? null,
    duration: createCourseDto.duration,
    lecturer: createCourseDto.lecturer ?? null,
    institute: createCourseDto.institute ?? null,
    expense: createCourseDto.expense,
    accreditationStatus: createCourseDto.accreditationStatus,
    accreditationFilePath: createCourseDto.accreditationFilePath ?? null,
    attendanceFilePath: createCourseDto.attendanceFilePath ?? null,
    tagId: createCourseDto.tagId,
    accreditationFile: toAttachmentAuditPayload(accreditationFile),
    attendanceFile: toAttachmentAuditPayload(attendanceFile),
  };
}

// แปลง metadata ของไฟล์แนบให้พร้อมบันทึกใน audit log โดยไม่เก็บ binary จริง
function toAttachmentAuditPayload(
  file: UploadableAttachment | null,
): Record<string, unknown> | null {
  if (!file) {
    return null;
  }

  return {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

// สรุปข้อผิดพลาดให้อยู่ในรูปแบบ JSON ที่อ่านย้อนหลังได้ง่าย
function toAuditErrorPayload(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: 'UnknownError',
    message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
  };
}
