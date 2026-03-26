import { CreateEmployeeSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateEmployeeDto extends createZodDto(CreateEmployeeSchema) {}
