import { AuditAction, Prisma } from '@workspace/database';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

const AUDIT_ACTIONS = Object.values(AuditAction);

// แปลง timestamp จาก query ให้เป็น Date ที่ Prisma ใช้งานได้อย่างปลอดภัย
function parseAuditLogDate(value: unknown): Date | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// หา action enum ที่มีข้อความตรงกับคำค้นเพื่อใช้แทน contains บน enum field
function getMatchedAuditActions(search: string): AuditAction[] {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return [];
  }

  return AUDIT_ACTIONS.filter((action) =>
    action.toLowerCase().includes(normalizedSearch),
  );
}

export function buildAuditLogWhereInput(
  queryDto: AuditLogQueryDto,
): Prisma.AuditLogWhereInput {
  const { search, model, action, dateRange } = queryDto;
  const where: Prisma.AuditLogWhereInput = {};
  const andConditions: Prisma.AuditLogWhereInput[] = [];

  if (model && model.length > 0) {
    andConditions.push({
      model: {
        in: model,
      },
    });
  }

  if (action && action.length > 0) {
    andConditions.push({
      action: {
        in: action,
      },
    });
  }

  if (dateRange && dateRange.length > 0) {
    const from = parseAuditLogDate(dateRange[0]);
    const to = parseAuditLogDate(dateRange[1] ?? dateRange[0]);

    if (from || to) {
      andConditions.push({
        timestamp: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      });
    }
  }

  if (search?.trim()) {
    const matchedActions = getMatchedAuditActions(search);

    andConditions.push({
      OR: [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          model: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          recordId: {
            contains: search,
            mode: 'insensitive',
          },
        },
        ...(matchedActions.length > 0
          ? [
              {
                action: {
                  in: matchedActions,
                },
              } satisfies Prisma.AuditLogWhereInput,
            ]
          : []),
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}
