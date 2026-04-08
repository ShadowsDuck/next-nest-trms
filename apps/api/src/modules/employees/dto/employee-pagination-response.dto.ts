import { employeePaginationSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeePaginationResponseDto extends createZodDto(
  employeePaginationSchema,
) {}
