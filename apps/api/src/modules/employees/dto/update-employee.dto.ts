import { employeeSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateEmployeeDto extends createZodDto(employeeSchema.partial()) {}
