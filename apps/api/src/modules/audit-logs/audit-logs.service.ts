import { AuditAction, Prisma } from '@workspace/database';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateAuditLogInput } from './audit-logs.types';
import { AuditLogPaginationResponseDto } from './dto/audit-log-pagination-response.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { buildAuditLogWhereInput } from './lib/audit-log-where.builder';
import { formatAuditLog } from './lib/audit-logs.mapper';

type AuditLogDbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  // ดึง audit logs แบบแบ่งหน้าโดยรองรับ filter และ search จากหน้า admin
  async findAll(
    queryDto: AuditLogQueryDto,
  ): Promise<AuditLogPaginationResponseDto> {
    const { page, limit } = queryDto;
    const where = buildAuditLogWhereInput(queryDto);

    const [auditLogs, total] = await Promise.all([
      this.prismaService.auditLog.findMany({
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
      this.prismaService.auditLog.count({ where }),
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

  // บันทึก audit log สำหรับทุก action โดยรองรับทั้ง client ปกติและ transaction client
  async create(
    input: CreateAuditLogInput,
    dbClient: AuditLogDbClient = this.prismaService,
  ): Promise<void> {
    await dbClient.auditLog.create({
      data: {
        action: input.action,
        model: input.model,
        recordId: input.recordId ?? null,
        oldValues: this.toAuditJsonValue(input.oldValues),
        newValues: this.toAuditJsonValue(input.newValues),
        userId: input.context.userId,
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
      },
    });
  }

  // พยายามบันทึก failed log โดยไม่ให้ข้อผิดพลาดของ audit log กลบ error หลัก
  async createFailureLog(
    input: Omit<CreateAuditLogInput, 'action'>,
    dbClient: AuditLogDbClient = this.prismaService,
  ): Promise<void> {
    try {
      await this.create(
        {
          ...input,
          action: AuditAction.Failed,
        },
        dbClient,
      );
    } catch (error) {
      this.logger.error(
        'บันทึก failed audit log ไม่สำเร็จ',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // แปลงข้อมูลให้เป็น JSON ที่ Prisma บันทึกได้อย่างปลอดภัย
  private toAuditJsonValue(
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
}
