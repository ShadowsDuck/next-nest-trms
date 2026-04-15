import { organizationUnitPathResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class OrganizationUnitPathResponseDto extends createZodDto(
  organizationUnitPathResponseSchema,
) {}
