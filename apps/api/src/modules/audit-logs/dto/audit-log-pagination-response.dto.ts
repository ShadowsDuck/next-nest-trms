import { auditLogPaginationResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class AuditLogPaginationResponseDto extends createZodDto(
  auditLogPaginationResponseSchema,
) {}
