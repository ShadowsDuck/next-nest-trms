import { courseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateCourseDto extends createZodDto(courseSchema) {}
