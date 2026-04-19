import { tagSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class TagResponseDto extends createZodDto(tagSchema) {}
