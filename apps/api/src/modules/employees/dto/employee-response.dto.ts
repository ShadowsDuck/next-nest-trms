import { EmployeeSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class EmployeeResponseDto extends createZodDto(EmployeeSchema) {}
