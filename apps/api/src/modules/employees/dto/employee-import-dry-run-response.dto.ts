import { employeeImportDryRunResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeImportDryRunResponseDto extends createZodDto(
  employeeImportDryRunResponseSchema,
) {}
