import { updateOrganizationUnitSchema } from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateOrganizationUnitDto extends createZodDto(
  updateOrganizationUnitSchema,
) {}
