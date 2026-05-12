import { Prisma } from '@workspace/database';
import type { CourseQuery } from '@workspace/schemas';
import type {} from '@workspace/schemas';
import { parseNumber } from '../../../utils/builder-utils';
import { parseTimestamp } from '../../../utils/date-utils';

export function buildCourseWhereInput(
  queryDto: CourseQuery,
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
    const from = parseTimestamp(dateRange[0]);
    const to = parseTimestamp(dateRange[1] ?? dateRange[0]);
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
