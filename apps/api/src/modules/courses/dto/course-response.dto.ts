import { courseResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CourseResponseDto extends createZodDto(courseResponseSchema) {}
