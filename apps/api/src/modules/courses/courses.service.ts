import {
  Course,
  Employee,
  OrganizationUnit,
  Prisma,
  Tag,
} from '@workspace/database';
import { toIsoDate, toIsoDateTime } from 'src/libs/date.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';

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

    if (tagId && tagId.length > 0) {
      where.tagId = { in: tagId };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { lecturer: { contains: search, mode: 'insensitive' } },
        { institute: { contains: search, mode: 'insensitive' } },
      ];
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
                        orgUnit: true,
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

    const orgPathByOrgUnitId = includeEmployees
      ? await this.buildOrgPathMap(courses)
      : new Map<string, OrganizationUnit[]>();

    return {
      data: courses.map((course) =>
        this.formatCourse(course, orgPathByOrgUnitId),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async buildOrgPathMap(
    courses: (Course & {
      trainingRecords?: {
        employee: Employee & { orgUnit: OrganizationUnit | null };
      }[];
    })[],
  ) {
    const orgUnitIds = new Set<string>();

    for (const course of courses) {
      for (const trainingRecord of course.trainingRecords ?? []) {
        if (trainingRecord.employee.orgUnitId) {
          orgUnitIds.add(trainingRecord.employee.orgUnitId);
        }
      }
    }

    const orgPathByOrgUnitId = new Map<string, OrganizationUnit[]>();

    await Promise.all(
      [...orgUnitIds].map(async (orgUnitId) => {
        orgPathByOrgUnitId.set(
          orgUnitId,
          await this.getOrganizationPath(orgUnitId),
        );
      }),
    );

    return orgPathByOrgUnitId;
  }

  private async getOrganizationPath(
    orgUnitId: string,
  ): Promise<OrganizationUnit[]> {
    const path: OrganizationUnit[] = [];
    let currentId: string | null = orgUnitId;

    while (currentId) {
      const orgUnit = await this.prismaService.organizationUnit.findUnique({
        where: { id: currentId },
      });

      if (!orgUnit) {
        break;
      }

      path.unshift(orgUnit);
      currentId = orgUnit.parentId;
    }

    return path;
  }

  private formatCourse(
    course: Course & {
      tag: Tag;
      trainingRecords?: {
        employee: Employee & { orgUnit: OrganizationUnit | null };
      }[];
    },
    orgPathByOrgUnitId: Map<string, OrganizationUnit[]> = new Map(),
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
        jobLevel: trainingRecord.employee.jobLevel,
        status: trainingRecord.employee.status,
        orgPath: trainingRecord.employee.orgUnitId
          ? (
              orgPathByOrgUnitId.get(trainingRecord.employee.orgUnitId) ?? []
            ).map((orgUnit) => ({
              id: orgUnit.id,
              name: orgUnit.name,
              level: orgUnit.level,
              parentId: orgUnit.parentId,
              createdAt: toIsoDateTime(orgUnit.createdAt),
              updatedAt: toIsoDateTime(orgUnit.updatedAt),
            }))
          : [],
      })),
    };
  }
}
