import { UpdateEmployeeSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateEmployeeDto extends createZodDto(UpdateEmployeeSchema) {}
