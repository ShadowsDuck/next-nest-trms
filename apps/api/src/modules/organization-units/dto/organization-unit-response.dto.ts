import { organizationUnitResponseSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class OrganizationUnitResponseDto extends createZodDto(
  organizationUnitResponseSchema,
) {}
