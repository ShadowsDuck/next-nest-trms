import {
  BusinessUnit,
  Course,
  Department,
  Division,
  Employee,
  OrgFunction,
  Plant,
  Prisma,
  Tag,
} from '@workspace/database';
import { toIsoDate, toIsoDateTime } from 'src/libs/date.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';

type CourseEmployee = Employee & {
  plant: Plant;
  businessUnit: BusinessUnit;
  orgFunction: OrgFunction;
  division: Division;
  department: Department;
};

@Injectable()
export class CoursesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    queryDto: CourseQueryDto,
  ): Promise<CoursePaginationResponseDto> {
    const {
      page,
      limit,
      search,
      type,
      tagName,
      dateRange,
      durationRange,
      accreditationStatus,
      tagId,
      includeEmployees,
    } = queryDto;

    const where: Prisma.CourseWhereInput = {};

    if (type && type.length > 0) {
      where.type = { in: type };
    }

    if (accreditationStatus && accreditationStatus.length > 0) {
      where.accreditationStatus = { in: accreditationStatus };
    }

    if (tagName && tagName.length > 0) {
      where.tag = { name: { in: tagName } };
    }

    if (tagId && tagId.length > 0) {
      where.tagId = { in: tagId };
    }

    if (dateRange && dateRange.length > 0) {
      const from = this.parseCourseDate(dateRange[0]);
      const to = this.parseCourseDate(dateRange[1] ?? dateRange[0]);
      const dateConditions: Prisma.CourseWhereInput[] = [];

      if (to) {
        dateConditions.push({ startDate: { lte: to } });
      }

      if (from) {
        dateConditions.push({ endDate: { gte: from } });
      }

      if (dateConditions.length > 0) {
        const existingConditions = Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : [];

        where.AND = [...existingConditions, ...dateConditions];
      }
    }

    if (durationRange && durationRange.length > 0) {
      const minDuration = this.parseNumber(durationRange[0]);
      const maxDuration = this.parseNumber(
        durationRange[1] ?? durationRange[0],
      );

      where.duration = {
        ...(minDuration != null ? { gte: minDuration } : {}),
        ...(maxDuration != null ? { lte: maxDuration } : {}),
      };
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

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
      data: courses.map((course) => this.formatCourse(course)),
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
      .map((course) => this.formatCourse(course))
      .sort(
        (a, b) =>
          (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
  }

  private parseCourseDate(value: unknown): Date | undefined {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private parseNumber(value: unknown): number | undefined {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined;
    }

    return value;
  }

  private formatCourse(
    course: Course & {
      tag: Tag;
      trainingRecords?: {
        employee: CourseEmployee;
      }[];
    },
  ): CourseResponseDto {
    return {
      ...course,
      startDate: toIsoDate(course.startDate),
      endDate: toIsoDate(course.endDate),
      startTime: course.startTime
        ? course.startTime.toISOString().slice(11, 19)
        : null,
      endTime: course.endTime
        ? course.endTime.toISOString().slice(11, 19)
        : null,
      duration: Number(course.duration),
      expense: Number(course.expense),
      createdAt: toIsoDateTime(course.createdAt),
      updatedAt: toIsoDateTime(course.updatedAt),
      tag: {
        id: course.tag.id,
        name: course.tag.name,
        colorCode: course.tag.colorCode,
      },
      participants: (course.trainingRecords ?? []).map((trainingRecord) => ({
        id: trainingRecord.employee.id,
        employeeNo: trainingRecord.employee.employeeNo,
        prefix: trainingRecord.employee.prefix,
        firstName: trainingRecord.employee.firstName,
        lastName: trainingRecord.employee.lastName,
        hireDate: toIsoDate(trainingRecord.employee.hireDate),
        jobLevel: trainingRecord.employee.jobLevel,
        status: trainingRecord.employee.status,
        plantName: trainingRecord.employee.plant.name,
        buName: trainingRecord.employee.businessUnit.name,
        functionName: trainingRecord.employee.orgFunction.name,
        divisionName: trainingRecord.employee.division.name,
        departmentName: trainingRecord.employee.department.name,
      })),
    };
  }
}
