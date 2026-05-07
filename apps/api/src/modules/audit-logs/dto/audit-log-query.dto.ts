import { auditLogQuerySchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class AuditLogQueryDto extends createZodDto(auditLogQuerySchema) {}
