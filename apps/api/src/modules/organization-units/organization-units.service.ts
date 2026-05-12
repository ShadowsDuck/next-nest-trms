import {
  BusinessUnit,
  Department,
  Division,
  OrgFunction,
  Plant,
} from '@workspace/database';
import { toIsoDateTime } from '../../lib/date-utils';
import { db } from '../../lib/db';
import {
  BusinessUnitQueryDto,
  BusinessUnitResponseDto,
  CreateBusinessUnitDto,
  CreateDepartmentDto,
  CreateDivisionDto,
  CreateOrgFunctionDto,
  CreatePlantDto,
  DepartmentQueryDto,
  DepartmentResponseDto,
  DivisionQueryDto,
  DivisionResponseDto,
  OrgFunctionQueryDto,
  OrgFunctionResponseDto,
  PlantResponseDto,
  UpdateBusinessUnitDto,
  UpdateDepartmentDto,
  UpdateDivisionDto,
  UpdateOrgFunctionDto,
  UpdatePlantDto,
} from './dto/organization-unit-resources.dto';
import { EmployeeOrganizationHierarchyInput } from './organization-hierarchy.types';

// ตรวจสอบว่า chain หน่วยงานของพนักงานสอดคล้องกันครบทุกระดับก่อนบันทึกข้อมูล
export async function validateEmployeeHierarchy(
  hierarchy: EmployeeOrganizationHierarchyInput,
): Promise<void> {
  const errors = await getEmployeeHierarchyErrors(hierarchy);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Changed to plain Error instead of BadRequestException
  }
}

export async function findPlants(): Promise<PlantResponseDto[]> {
  const plants = await db.plant.findMany({
    orderBy: { name: 'asc' },
  });

  return plants.map((plant) => formatPlant(plant));
}

export async function createPlant(
  createPlantDto: CreatePlantDto,
): Promise<PlantResponseDto> {
  const plant = await db.plant.create({
    data: {
      name: createPlantDto.name,
    },
  });

  return formatPlant(plant);
}

export async function updatePlant(
  id: string,
  updatePlantDto: UpdatePlantDto,
): Promise<PlantResponseDto> {
  await ensurePlantExists(id);

  const plant = await db.plant.update({
    where: { id },
    data: updatePlantDto,
  });

  return formatPlant(plant);
}

export async function findBusinessUnits(
  query: BusinessUnitQueryDto,
): Promise<BusinessUnitResponseDto[]> {
  if (query.plantId) {
    await ensurePlantExists(query.plantId);
  }

  const businessUnits = await db.businessUnit.findMany({
    where: query.plantId ? { plantId: query.plantId } : undefined,
    orderBy: { name: 'asc' },
  });

  return businessUnits.map((businessUnit) => formatBusinessUnit(businessUnit));
}

export async function createBusinessUnit(
  createBusinessUnitDto: CreateBusinessUnitDto,
): Promise<BusinessUnitResponseDto> {
  await ensurePlantExists(createBusinessUnitDto.plantId);

  try {
    const businessUnit = await db.businessUnit.create({
      data: {
        name: createBusinessUnitDto.name,
        plantId: createBusinessUnitDto.plantId,
      },
    });

    return formatBusinessUnit(businessUnit);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

export async function updateBusinessUnit(
  id: string,
  updateBusinessUnitDto: UpdateBusinessUnitDto,
): Promise<BusinessUnitResponseDto> {
  await ensureBusinessUnitExists(id);

  if (updateBusinessUnitDto.plantId) {
    await ensurePlantExists(updateBusinessUnitDto.plantId);
  }

  try {
    const businessUnit = await db.businessUnit.update({
      where: { id },
      data: updateBusinessUnitDto,
    });

    return formatBusinessUnit(businessUnit);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

export async function findFunctions(
  query: OrgFunctionQueryDto,
): Promise<OrgFunctionResponseDto[]> {
  if (query.businessUnitId) {
    await ensureBusinessUnitExists(query.businessUnitId);
  }

  const orgFunctions = await db.orgFunction.findMany({
    where: query.businessUnitId
      ? { businessUnitId: query.businessUnitId }
      : undefined,
    orderBy: { name: 'asc' },
  });

  return orgFunctions.map((orgFunction) => formatOrgFunction(orgFunction));
}

export async function createFunction(
  createOrgFunctionDto: CreateOrgFunctionDto,
): Promise<OrgFunctionResponseDto> {
  await ensureBusinessUnitExists(createOrgFunctionDto.businessUnitId);

  try {
    const orgFunction = await db.orgFunction.create({
      data: {
        name: createOrgFunctionDto.name,
        businessUnitId: createOrgFunctionDto.businessUnitId,
      },
    });

    return formatOrgFunction(orgFunction);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

export async function updateFunction(
  id: string,
  updateOrgFunctionDto: UpdateOrgFunctionDto,
): Promise<OrgFunctionResponseDto> {
  await ensureFunctionExists(id);

  if (updateOrgFunctionDto.businessUnitId) {
    await ensureBusinessUnitExists(updateOrgFunctionDto.businessUnitId);
  }

  try {
    const orgFunction = await db.orgFunction.update({
      where: { id },
      data: updateOrgFunctionDto,
    });

    return formatOrgFunction(orgFunction);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

export async function findDivisions(
  query: DivisionQueryDto,
): Promise<DivisionResponseDto[]> {
  if (query.functionId) {
    await ensureFunctionExists(query.functionId);
  }

  const divisions = await db.division.findMany({
    where: query.functionId ? { functionId: query.functionId } : undefined,
    orderBy: { name: 'asc' },
  });

  return divisions.map((division) => formatDivision(division));
}

export async function createDivision(
  createDivisionDto: CreateDivisionDto,
): Promise<DivisionResponseDto> {
  await ensureFunctionExists(createDivisionDto.functionId);

  try {
    const division = await db.division.create({
      data: {
        name: createDivisionDto.name,
        functionId: createDivisionDto.functionId,
      },
    });

    return formatDivision(division);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

export async function updateDivision(
  id: string,
  updateDivisionDto: UpdateDivisionDto,
): Promise<DivisionResponseDto> {
  await ensureDivisionExists(id);

  if (updateDivisionDto.functionId) {
    await ensureFunctionExists(updateDivisionDto.functionId);
  }

  try {
    const division = await db.division.update({
      where: { id },
      data: updateDivisionDto,
    });

    return formatDivision(division);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

export async function findDepartments(
  query: DepartmentQueryDto,
): Promise<DepartmentResponseDto[]> {
  if (query.divisionId) {
    await ensureDivisionExists(query.divisionId);
  }

  const departments = await db.department.findMany({
    where: query.divisionId ? { divisionId: query.divisionId } : undefined,
    orderBy: { name: 'asc' },
  });

  return departments.map((department) => formatDepartment(department));
}

export async function createDepartment(
  createDepartmentDto: CreateDepartmentDto,
): Promise<DepartmentResponseDto> {
  await ensureDivisionExists(createDepartmentDto.divisionId);

  try {
    const department = await db.department.create({
      data: {
        name: createDepartmentDto.name,
        divisionId: createDepartmentDto.divisionId,
      },
    });

    return formatDepartment(department);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

export async function updateDepartment(
  id: string,
  updateDepartmentDto: UpdateDepartmentDto,
): Promise<DepartmentResponseDto> {
  await ensureDepartmentExists(id);

  if (updateDepartmentDto.divisionId) {
    await ensureDivisionExists(updateDepartmentDto.divisionId);
  }

  try {
    const department = await db.department.update({
      where: { id },
      data: updateDepartmentDto,
    });

    return formatDepartment(department);
  } catch (error) {
    rethrowDuplicateNameError(error);
    throw error;
  }
}

// ตรวจสอบ chain หน่วยงานของพนักงานและคืนรายการข้อความผิดพลาดโดยไม่ throw
async function getEmployeeHierarchyErrors(
  hierarchy: EmployeeOrganizationHierarchyInput,
): Promise<string[]> {
  const errors: string[] = [];
  const [plant, businessUnit, orgFunction, division, department] =
    await Promise.all([
      db.plant.findUnique({
        where: { id: hierarchy.plantId },
      }),
      db.businessUnit.findUnique({
        where: { id: hierarchy.buId },
      }),
      db.orgFunction.findUnique({
        where: { id: hierarchy.functionId },
      }),
      db.division.findUnique({
        where: { id: hierarchy.divisionId },
      }),
      db.department.findUnique({
        where: { id: hierarchy.departmentId },
      }),
    ]);

  if (!plant) {
    errors.push('ไม่พบ Plant ที่ระบุ');
  }
  if (!businessUnit) {
    errors.push('ไม่พบ Business Unit ที่ระบุ');
  }
  if (!orgFunction) {
    errors.push('ไม่พบ Function ที่ระบุ');
  }
  if (!division) {
    errors.push('ไม่พบ Division ที่ระบุ');
  }
  if (!department) {
    errors.push('ไม่พบ Department ที่ระบุ');
  }

  if (errors.length > 0) {
    return errors;
  }

  if (businessUnit!.plantId !== hierarchy.plantId) {
    errors.push('Business Unit ที่ระบุไม่ได้อยู่ภายใต้ Plant เดียวกัน');
  }

  if (orgFunction!.businessUnitId !== hierarchy.buId) {
    errors.push('Function ที่ระบุไม่ได้อยู่ภายใต้ Business Unit เดียวกัน');
  }

  if (division!.functionId !== hierarchy.functionId) {
    errors.push('Division ที่ระบุไม่ได้อยู่ภายใต้ Function เดียวกัน');
  }

  if (department!.divisionId !== hierarchy.divisionId) {
    errors.push('Department ที่ระบุไม่ได้อยู่ภายใต้ Division เดียวกัน');
  }

  return errors;
}

async function ensurePlantExists(id: string) {
  const plant = await db.plant.findUnique({
    where: { id },
  });

  if (!plant) {
    throw new Error('ไม่พบ Plant ที่ระบุ');
  }

  return plant;
}

async function ensureBusinessUnitExists(id: string) {
  const businessUnit = await db.businessUnit.findUnique({
    where: { id },
  });

  if (!businessUnit) {
    throw new Error('ไม่พบ Business Unit ที่ระบุ');
  }

  return businessUnit;
}

async function ensureFunctionExists(id: string) {
  const orgFunction = await db.orgFunction.findUnique({
    where: { id },
  });

  if (!orgFunction) {
    throw new Error('ไม่พบ Function ที่ระบุ');
  }

  return orgFunction;
}

async function ensureDivisionExists(id: string) {
  const division = await db.division.findUnique({
    where: { id },
  });

  if (!division) {
    throw new Error('ไม่พบ Division ที่ระบุ');
  }

  return division;
}

async function ensureDepartmentExists(id: string) {
  const department = await db.department.findUnique({
    where: { id },
  });

  if (!department) {
    throw new Error('ไม่พบ Department ที่ระบุ');
  }

  return department;
}

function rethrowDuplicateNameError(error: unknown): void {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    throw new Error('ชื่อหน่วยงานซ้ำภายใต้หน่วยงานแม่เดียวกัน');
  }
}

function formatPlant(plant: Plant): PlantResponseDto {
  return {
    id: plant.id,
    name: plant.name,
    createdAt: toIsoDateTime(plant.createdAt),
    updatedAt: toIsoDateTime(plant.updatedAt),
  };
}

function formatBusinessUnit(
  businessUnit: BusinessUnit,
): BusinessUnitResponseDto {
  return {
    id: businessUnit.id,
    name: businessUnit.name,
    plantId: businessUnit.plantId,
    createdAt: toIsoDateTime(businessUnit.createdAt),
    updatedAt: toIsoDateTime(businessUnit.updatedAt),
  };
}

function formatOrgFunction(orgFunction: OrgFunction): OrgFunctionResponseDto {
  return {
    id: orgFunction.id,
    name: orgFunction.name,
    businessUnitId: orgFunction.businessUnitId,
    createdAt: toIsoDateTime(orgFunction.createdAt),
    updatedAt: toIsoDateTime(orgFunction.updatedAt),
  };
}

function formatDivision(division: Division): DivisionResponseDto {
  return {
    id: division.id,
    name: division.name,
    functionId: division.functionId,
    createdAt: toIsoDateTime(division.createdAt),
    updatedAt: toIsoDateTime(division.updatedAt),
  };
}

function formatDepartment(department: Department): DepartmentResponseDto {
  return {
    id: department.id,
    name: department.name,
    divisionId: department.divisionId,
    createdAt: toIsoDateTime(department.createdAt),
    updatedAt: toIsoDateTime(department.updatedAt),
  };
}
