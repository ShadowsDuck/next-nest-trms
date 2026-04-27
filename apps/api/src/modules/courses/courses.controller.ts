import { ZodResponse } from 'nestjs-zod';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

type CourseUploadFiles = {
  accreditationFile?: UploadedAttachmentFile[];
  attendanceFile?: UploadedAttachmentFile[];
};

type UploadedAttachmentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller('courses')
@ApiTags('Courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'accreditationFile', maxCount: 1 },
      { name: 'attendanceFile', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'สร้างหลักสูตรใหม่' })
  @ZodResponse({
    status: 201,
    type: CourseResponseDto,
    description: 'สร้างหลักสูตรสำเร็จ',
  })
  @ApiBadRequestResponse({
    description: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
  })
  @ApiUnauthorizedResponse({
    description: 'ไม่ได้เข้าสู่ระบบหรือโทเคนไม่ถูกต้อง',
  })
  @ApiForbiddenResponse({
    description: 'ไม่มีสิทธิ์สร้างหลักสูตร',
  })
  @ApiConflictResponse({
    description: 'ข้อมูลหลักสูตรซ้ำกับในระบบ',
  })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  // รับคำขอสร้างหลักสูตรใหม่จากผู้ใช้และส่งต่อให้ service บันทึกข้อมูล
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles() files: CourseUploadFiles,
  ): Promise<CourseResponseDto> {
    const accreditationFile = this.getSingleCourseAttachment(
      files,
      'accreditationFile',
    );
    const attendanceFile = this.getSingleCourseAttachment(
      files,
      'attendanceFile',
    );

    this.validateAttachmentFile(accreditationFile, 'ไฟล์รับรอง');
    this.validateAttachmentFile(attendanceFile, 'ไฟล์รายชื่อผู้เข้าอบรม');

    return await this.coursesService.create({
      ...createCourseDto,
      accreditationFile,
      attendanceFile,
    } as CreateCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลหลักสูตรทั้งหมด' })
  @ZodResponse({
    type: CoursePaginationResponseDto,
    status: 200,
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  @ApiUnauthorizedResponse({ description: 'เข้าสู่ระบบไม่สำเร็จ' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async findAll(
    @Query() queryDto: CourseQueryDto,
  ): Promise<CoursePaginationResponseDto> {
    return await this.coursesService.findAll(queryDto);
  }

  // ดึงไฟล์แนบจากฟิลด์ที่อัปโหลดมาและคืนค่าไฟล์เดียวต่อหนึ่งฟิลด์
  private getSingleCourseAttachment(
    files: CourseUploadFiles | undefined,
    fieldName: keyof CourseUploadFiles,
  ): UploadedAttachmentFile | null {
    const file = files?.[fieldName]?.[0];
    return file ?? null;
  }

  // ตรวจชนิดและขนาดไฟล์แนบให้เป็นไปตามข้อกำหนดก่อนส่งเข้า service
  private validateAttachmentFile(
    file: UploadedAttachmentFile | null,
    fieldLabel: string,
  ): void {
    if (!file) {
      return;
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `${fieldLabel}รองรับเฉพาะ PDF, JPG, PNG, XLS, XLSX และ CSV`,
      );
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new BadRequestException(`${fieldLabel}ต้องมีขนาดไม่เกิน 10 MB`);
    }
  }
}
