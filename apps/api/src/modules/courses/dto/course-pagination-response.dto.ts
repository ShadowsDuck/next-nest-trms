import { coursePaginationResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CoursePaginationResponseDto extends createZodDto(
  coursePaginationResponseSchema,
) {}
