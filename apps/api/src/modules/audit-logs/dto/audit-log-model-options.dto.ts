import { auditLogModelOptionsSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class AuditLogModelOptionsDto extends createZodDto(
  auditLogModelOptionsSchema,
) {}
