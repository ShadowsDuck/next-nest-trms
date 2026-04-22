import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { buildCourseWhereInput } from './lib/course-where.builder';
import { formatCourse } from './lib/courses.mapper';

@Injectable()
export class CoursesService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
