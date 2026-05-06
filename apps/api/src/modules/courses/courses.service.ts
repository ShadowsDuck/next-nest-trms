import { AuditAction } from '@workspace/database';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuditLogContext } from '../audit-logs/audit-logs.types';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { buildCourseWhereInput } from './lib/course-where.builder';
import { formatCourse } from './lib/courses.mapper';
import { COURSE_ATTACHMENT_STORAGE } from './storage/course-attachment-storage.contract';
import type {
  CourseAttachmentStorage,
  CourseAttachmentUploadResult,
} from './storage/course-attachment-storage.contract';

type UploadableAttachment = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    @Inject(COURSE_ATTACHMENT_STORAGE)
    private readonly attachmentStorage: CourseAttachmentStorage,
  ) {}

  // สร้างหลักสูตรใหม่ พร้อมตรวจความถูกต้องของวันที่ เวลา และหมวดหมู่
  async create(
    createCourseDto: CreateCourseDto,
    auditLogContext: AuditLogContext,
  ): Promise<CourseResponseDto> {
    const attachmentPayload = createCourseDto as CreateCourseDto &
      Record<string, unknown>;
    const accreditationFile = this.toUploadableAttachment(
      attachmentPayload.accreditationFile,
    );
    const attendanceFile = this.toUploadableAttachment(
      attachmentPayload.attendanceFile,
    );
    const uploadedFiles: CourseAttachmentUploadResult[] = [];

    try {
      const tag = await this.prismaService.tag.findUnique({
        where: { id: createCourseDto.tagId },
      });
      if (!tag) {
        throw new BadRequestException('ไม่พบหมวดหมู่หลักสูตรที่ระบุ');
      }

      const startDate = new Date(createCourseDto.startDate);
      const endDate = new Date(createCourseDto.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('รูปแบบวันที่ไม่ถูกต้อง');
      }
      if (startDate.getTime() > endDate.getTime()) {
        throw new BadRequestException('วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด');
      }

      const startTime = this.parseTime(createCourseDto.startTime ?? null);
      const endTime = this.parseTime(createCourseDto.endTime ?? null);
      if (startDate.getTime() === endDate.getTime() && startTime && endTime) {
        if (startTime.getTime() > endTime.getTime()) {
          throw new BadRequestException(
            'เวลาเริ่มต้องไม่มากกว่าเวลาสิ้นสุดเมื่อจัดอบรมวันเดียวกัน',
          );
        }
      }

      const [accreditationUpload, attendanceUpload] =
        await this.uploadCourseAttachments(
          accreditationFile,
          attendanceFile,
          uploadedFiles,
          createCourseDto.title,
          startDate,
        );

      const created = await this.prismaService.$transaction(async (tx) => {
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
              this.toFallbackFilePath(accreditationFile),
            attendanceFilePath:
              attendanceUpload?.filePath ??
              attendanceUpload?.webViewLink ??
              createCourseDto.attendanceFilePath ??
              this.toFallbackFilePath(attendanceFile),
            tagId: createCourseDto.tagId,
          },
          include: {
            tag: true,
          },
        });

        await this.auditLogsService.create(
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
      await this.rollbackUploadedFiles(uploadedFiles);
      await this.auditLogsService.createFailureLog({
        model: 'Course',
        newValues: {
          payload: this.toCourseAuditPayload(createCourseDto),
          error: this.toAuditErrorPayload(error),
        },
        context: auditLogContext,
      });
      throw error;
    }
  }

  async findAll(
    queryDto: CourseQueryDto,
    auditLogContext?: AuditLogContext,
  ): Promise<CoursePaginationResponseDto> {
    const { page, limit, includeEmployees } = queryDto;
    const where = buildCourseWhereInput(queryDto);

    try {
      const [courses, total] = await Promise.all([
        this.prismaService.course.findMany({
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
        this.prismaService.course.count({ where }),
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
        await this.auditLogsService.create({
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
        await this.auditLogsService.createFailureLog({
          model: 'Course',
          newValues: {
            filters: queryDto,
            includeEmployees,
            error: this.toAuditErrorPayload(error),
          },
          context: auditLogContext,
        });
      }

      throw error;
    }
  }

  async findByCourseIdsForReport(
    courseIds: string[],
  ): Promise<CourseResponseDto[]> {
    if (courseIds.length === 0) {
      return [];
    }

    const courses = await this.prismaService.course.findMany({
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
  private parseTime(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const timePattern = /^\d{2}:\d{2}:\d{2}$/;
    if (!timePattern.test(value)) {
      throw new BadRequestException('รูปแบบเวลาไม่ถูกต้อง');
    }

    const parsed = new Date(`1970-01-01T${value}.000Z`);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException('รูปแบบเวลาไม่ถูกต้อง');
    }

    return parsed;
  }

  // แปลงข้อมูลไฟล์ที่อาจถูกส่งมาจาก multipart ให้เป็นรูปแบบที่พร้อมอัปโหลด
  private toUploadableAttachment(value: unknown): UploadableAttachment | null {
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
  private async uploadOptionalAttachment(
    kind: 'accreditation' | 'attendance',
    file: UploadableAttachment | null,
    uploadedFiles: CourseAttachmentUploadResult[],
    courseName: string,
    startDate: Date | string,
  ): Promise<CourseAttachmentUploadResult | null> {
    if (!file) {
      return null;
    }

    const uploaded = await this.attachmentStorage.uploadAttachment({
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
  private async uploadCourseAttachments(
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
        this.uploadOptionalAttachment(
          'accreditation',
          accreditationFile,
          uploadedFiles,
          courseName,
          startDate,
        ),
        this.uploadOptionalAttachment(
          'attendance',
          attendanceFile,
          uploadedFiles,
          courseName,
          startDate,
        ),
      ]);
    } catch (error) {
      await this.rollbackUploadedFiles(uploadedFiles);
      throw error;
    }
  }

  // ลบไฟล์ที่อัปโหลดแล้วทั้งหมดเมื่อเกิดข้อผิดพลาดภายหลัง เพื่อคงพฤติกรรมแบบ atomic
  private async rollbackUploadedFiles(
    uploadedFiles: CourseAttachmentUploadResult[],
  ): Promise<void> {
    for (const file of uploadedFiles) {
      try {
        await this.attachmentStorage.deleteAttachment({ fileId: file.fileId });
      } catch {
        this.logger.warn(`Rollback attachment failed: ${file.fileId}`);
      }
    }

    uploadedFiles.length = 0;
  }

  // สร้างค่า path สำรองจากชื่อไฟล์ เมื่อยังไม่มี path ที่คืนกลับจาก provider
  private toFallbackFilePath(file: UploadableAttachment | null): string | null {
    if (!file) {
      return null;
    }

    return `uploads/courses/${file.originalname}`;
  }

  // สร้าง payload สำหรับ audit log โดยตัดข้อมูลไฟล์ binary ออกและเก็บเฉพาะ metadata ที่จำเป็น
  private toCourseAuditPayload(
    createCourseDto: CreateCourseDto,
  ): Record<string, unknown> {
    const attachmentPayload = createCourseDto as CreateCourseDto &
      Record<string, unknown>;
    const accreditationFile = this.toUploadableAttachment(
      attachmentPayload.accreditationFile,
    );
    const attendanceFile = this.toUploadableAttachment(
      attachmentPayload.attendanceFile,
    );

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
      accreditationFile: this.toAttachmentAuditPayload(accreditationFile),
      attendanceFile: this.toAttachmentAuditPayload(attendanceFile),
    };
  }

  // แปลง metadata ของไฟล์แนบให้พร้อมบันทึกใน audit log โดยไม่เก็บ binary จริง
  private toAttachmentAuditPayload(
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
  private toAuditErrorPayload(error: unknown): Record<string, string> {
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
}
