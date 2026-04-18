import { createSummaryReportResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateSummaryReportResponseDto extends createZodDto(
  createSummaryReportResponseSchema,
) {}
