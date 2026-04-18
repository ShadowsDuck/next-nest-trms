import {
  businessUnitQuerySchema,
  businessUnitResponseSchema,
  businessUnitSchema,
  departmentQuerySchema,
  departmentResponseSchema,
  departmentSchema,
  divisionQuerySchema,
  divisionResponseSchema,
  divisionSchema,
  orgFunctionQuerySchema,
  orgFunctionResponseSchema,
  orgFunctionSchema,
  plantResponseSchema,
  plantSchema,
  updateBusinessUnitSchema,
  updateDepartmentSchema,
  updateDivisionSchema,
  updateOrgFunctionSchema,
  updatePlantSchema,
} from '@workspace/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreatePlantDto extends createZodDto(plantSchema) {}
export class UpdatePlantDto extends createZodDto(updatePlantSchema) {}
export class PlantResponseDto extends createZodDto(plantResponseSchema) {}

export class CreateBusinessUnitDto extends createZodDto(businessUnitSchema) {}
export class UpdateBusinessUnitDto extends createZodDto(
  updateBusinessUnitSchema,
) {}
export class BusinessUnitQueryDto extends createZodDto(
  businessUnitQuerySchema,
) {}
export class BusinessUnitResponseDto extends createZodDto(
  businessUnitResponseSchema,
) {}

export class CreateOrgFunctionDto extends createZodDto(orgFunctionSchema) {}
export class UpdateOrgFunctionDto extends createZodDto(
  updateOrgFunctionSchema,
) {}
export class OrgFunctionQueryDto extends createZodDto(orgFunctionQuerySchema) {}
export class OrgFunctionResponseDto extends createZodDto(
  orgFunctionResponseSchema,
) {}

export class CreateDivisionDto extends createZodDto(divisionSchema) {}
export class UpdateDivisionDto extends createZodDto(updateDivisionSchema) {}
export class DivisionQueryDto extends createZodDto(divisionQuerySchema) {}
export class DivisionResponseDto extends createZodDto(divisionResponseSchema) {}

export class CreateDepartmentDto extends createZodDto(departmentSchema) {}
export class UpdateDepartmentDto extends createZodDto(updateDepartmentSchema) {}
export class DepartmentQueryDto extends createZodDto(departmentQuerySchema) {}
export class DepartmentResponseDto extends createZodDto(
  departmentResponseSchema,
) {}
