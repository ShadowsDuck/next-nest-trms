import { RegisterSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterSchema) {}
