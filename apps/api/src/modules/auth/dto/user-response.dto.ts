import { UserResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class UserResponseDto extends createZodDto(UserResponseSchema) {}
