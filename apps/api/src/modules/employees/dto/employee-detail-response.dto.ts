import { employeeDetailResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeDetailResponseDto extends createZodDto(
  employeeDetailResponseSchema,
) {}
