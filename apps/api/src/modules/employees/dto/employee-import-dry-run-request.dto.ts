import { employeeImportDryRunRequestSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeImportDryRunRequestDto extends createZodDto(
  employeeImportDryRunRequestSchema,
) {}
