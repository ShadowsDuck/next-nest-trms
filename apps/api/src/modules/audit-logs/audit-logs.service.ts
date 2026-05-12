import { AuditAction, Prisma } from '@workspace/database';
import { db } from '../../lib/db';
import type { CreateAuditLogInput } from './audit-logs.types';
import { AuditLogPaginationResponseDto } from './dto/audit-log-pagination-response.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { buildAuditLogWhereInput } from './lib/audit-log-where.builder';
import { formatAuditLog } from './lib/audit-logs.mapper';

type AuditLogDbClient = typeof db | Prisma.TransactionClient;

// ดึง audit logs แบบแบ่งหน้าโดยรองรับ filter และ search จากหน้า admin
export async function findAllAuditLogs(
  queryDto: AuditLogQueryDto,
): Promise<AuditLogPaginationResponseDto> {
  const { page, limit } = queryDto;
  const where = buildAuditLogWhereInput(queryDto);

  const [auditLogs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        {
          timestamp: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    data: auditLogs.map((auditLog) => formatAuditLog(auditLog)),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ดึงรายการ model ทั้งหมดที่มีอยู่ใน audit logs แบบไม่ผูกกับ filter ปัจจุบัน
export async function findAllAuditModels(): Promise<string[]> {
  const models = await db.auditLog.findMany({
    select: {
      model: true,
    },
    distinct: ['model'],
    orderBy: {
      model: 'asc',
    },
  });

  return models.map((item) => item.model);
}

// บันทึก audit log สำหรับทุก action โดยรองรับทั้ง client ปกติและ transaction client
export async function createAuditLog(
  input: CreateAuditLogInput,
  dbClient: AuditLogDbClient = db,
): Promise<void> {
  await dbClient.auditLog.create({
    data: {
      action: input.action,
      model: input.model,
      recordId: input.recordId ?? null,
      oldValues: toAuditJsonValue(input.oldValues),
      newValues: toAuditJsonValue(input.newValues),
      userId: input.context.userId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
    },
  });
}

// พยายามบันทึก failed log โดยไม่ให้ข้อผิดพลาดของ audit log กลบ error หลัก
export async function createFailureLog(
  input: Omit<CreateAuditLogInput, 'action'>,
  dbClient: AuditLogDbClient = db,
): Promise<void> {
  try {
    await createAuditLog(
      {
        ...input,
        action: AuditAction.Failed,
      },
      dbClient,
    );
  } catch (error) {
    console.error(
      'บันทึก failed audit log ไม่สำเร็จ',
      error instanceof Error ? error.stack : undefined,
    );
  }
}

// แปลงข้อมูลให้เป็น JSON ที่ Prisma บันทึกได้อย่างปลอดภัย
function toAuditJsonValue(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return JSON.parse(
    JSON.stringify(value, (_key, currentValue: unknown) => {
      if (typeof currentValue === 'bigint') {
        return currentValue.toString();
      }

      if (Buffer.isBuffer(currentValue)) {
        return `[buffer:${currentValue.length}]`;
      }

      return currentValue;
    }),
  ) as Prisma.InputJsonValue;
}
