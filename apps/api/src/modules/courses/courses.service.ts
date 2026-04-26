import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { buildCourseWhereInput } from './lib/course-where.builder';
import { formatCourse } from './lib/courses.mapper';

@Injectable()
export class CoursesService {
  constructor(private readonly prismaService: PrismaService) {}

  // สร้างหลักสูตรใหม่ พร้อมตรวจความถูกต้องของวันที่ เวลา และหมวดหมู่
  async create(createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
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

    const created = await this.prismaService.course.create({
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
        accreditationFilePath: createCourseDto.accreditationFilePath ?? null,
        attendanceFilePath: createCourseDto.attendanceFilePath ?? null,
        tagId: createCourseDto.tagId,
      },
      include: {
        tag: true,
      },
    });

    return formatCourse(created);
  }

  async findAll(
    queryDto: CourseQueryDto,
  ): Promise<CoursePaginationResponseDto> {
    const { page, limit, includeEmployees } = queryDto;
    const where = buildCourseWhereInput(queryDto);

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

    return {
      data: courses.map((course) => formatCourse(course)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
}
