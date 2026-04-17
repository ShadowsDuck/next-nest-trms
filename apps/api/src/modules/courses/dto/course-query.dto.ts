import { courseQuerySchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CourseQueryDto extends createZodDto(courseQuerySchema) {}
