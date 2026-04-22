import { employeeImportResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeImportResponseDto extends createZodDto(
  employeeImportResponseSchema,
) {}
