import { createSummaryReportRequestSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateSummaryReportDto extends createZodDto(
  createSummaryReportRequestSchema,
) {}
