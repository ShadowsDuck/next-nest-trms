import { employeeImportRequestSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeImportRequestDto extends createZodDto(
  employeeImportRequestSchema,
) {}
