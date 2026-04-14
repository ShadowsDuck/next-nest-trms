import { employeePaginationResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeePaginationResponseDto extends createZodDto(
  employeePaginationResponseSchema,
) {}
