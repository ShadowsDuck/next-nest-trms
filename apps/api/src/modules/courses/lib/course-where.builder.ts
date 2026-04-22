import { Prisma } from '@workspace/database';
import { CourseQueryDto } from '../dto/course-query.dto';

function parseCourseDate(value: unknown): Date | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  return value;
}

export function buildCourseWhereInput(
  queryDto: CourseQueryDto,
): Prisma.CourseWhereInput {
  const {
    search,
    type,
    tagName,
    dateRange,
    durationRange,
    accreditationStatus,
    tagId,
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
    const from = parseCourseDate(dateRange[0]);
    const to = parseCourseDate(dateRange[1] ?? dateRange[0]);
    const dateConditions: Prisma.CourseWhereInput[] = [];

    if (to) {
      dateConditions.push({ startDate: { lte: to } });
    }

    if (from) {
      dateConditions.push({ endDate: { gte: from } });
    }

    if (dateConditions.length > 0) {
      where.AND = dateConditions;
    }
  }

  if (durationRange && durationRange.length > 0) {
    const minDuration = parseNumber(durationRange[0]);
    const maxDuration = parseNumber(durationRange[1] ?? durationRange[0]);

    where.duration = {
      ...(minDuration != null ? { gte: minDuration } : {}),
      ...(maxDuration != null ? { lte: maxDuration } : {}),
    };
  }

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  return where;
}
