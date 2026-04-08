import { employeeQuerySchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeQueryDto extends createZodDto(employeeQuerySchema) {}
