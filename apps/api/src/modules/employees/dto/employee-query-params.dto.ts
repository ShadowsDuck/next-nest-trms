import { EmployeeQueryParamsSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeQueryParamsDto extends createZodDto(
  EmployeeQueryParamsSchema,
) {}
