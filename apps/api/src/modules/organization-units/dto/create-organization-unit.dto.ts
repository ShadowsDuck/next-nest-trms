import { organizationUnitSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateOrganizationUnitDto extends createZodDto(
  organizationUnitSchema,
) {}
