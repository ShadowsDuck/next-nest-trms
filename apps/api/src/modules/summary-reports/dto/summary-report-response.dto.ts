import { summaryReportResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class SummaryReportResponseDto extends createZodDto(
  summaryReportResponseSchema,
) {}
