import {
  BusinessUnit,
  Department,
  Division,
  OrgFunction,
  Plant,
} from '@workspace/database';
import { toIsoDateTime } from 'src/libs/date.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class OrganizationUnitsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findPlants(): Promise<PlantResponseDto[]> {
    const plants = await this.prismaService.plant.findMany({
      orderBy: { name: 'asc' },
    });

    return plants.map((plant) => this.formatPlant(plant));
  }

  async createPlant(createPlantDto: CreatePlantDto): Promise<PlantResponseDto> {
    const plant = await this.prismaService.plant.create({
      data: {
        name: createPlantDto.name,
      },
    });

    return this.formatPlant(plant);
  }

  async updatePlant(
    id: string,
    updatePlantDto: UpdatePlantDto,
  ): Promise<PlantResponseDto> {
    await this.ensurePlantExists(id);

    const plant = await this.prismaService.plant.update({
      where: { id },
      data: updatePlantDto,
    });

    return this.formatPlant(plant);
  }

  async findBusinessUnits(
    query: BusinessUnitQueryDto,
  ): Promise<BusinessUnitResponseDto[]> {
    if (query.plantId) {
      await this.ensurePlantExists(query.plantId);
    }

    const businessUnits = await this.prismaService.businessUnit.findMany({
      where: query.plantId ? { plantId: query.plantId } : undefined,
      orderBy: { name: 'asc' },
    });

    return businessUnits.map((businessUnit) =>
      this.formatBusinessUnit(businessUnit),
    );
  }

  async createBusinessUnit(
    createBusinessUnitDto: CreateBusinessUnitDto,
  ): Promise<BusinessUnitResponseDto> {
    await this.ensurePlantExists(createBusinessUnitDto.plantId);

    try {
      const businessUnit = await this.prismaService.businessUnit.create({
        data: {
          name: createBusinessUnitDto.name,
          plantId: createBusinessUnitDto.plantId,
        },
      });

      return this.formatBusinessUnit(businessUnit);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  async updateBusinessUnit(
    id: string,
    updateBusinessUnitDto: UpdateBusinessUnitDto,
  ): Promise<BusinessUnitResponseDto> {
    await this.ensureBusinessUnitExists(id);

    if (updateBusinessUnitDto.plantId) {
      await this.ensurePlantExists(updateBusinessUnitDto.plantId);
    }

    try {
      const businessUnit = await this.prismaService.businessUnit.update({
        where: { id },
        data: updateBusinessUnitDto,
      });

      return this.formatBusinessUnit(businessUnit);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  async findFunctions(
    query: OrgFunctionQueryDto,
  ): Promise<OrgFunctionResponseDto[]> {
    if (query.businessUnitId) {
      await this.ensureBusinessUnitExists(query.businessUnitId);
    }

    const orgFunctions = await this.prismaService.orgFunction.findMany({
      where: query.businessUnitId
        ? { businessUnitId: query.businessUnitId }
        : undefined,
      orderBy: { name: 'asc' },
    });

    return orgFunctions.map((orgFunction) =>
      this.formatOrgFunction(orgFunction),
    );
  }

  async createFunction(
    createOrgFunctionDto: CreateOrgFunctionDto,
  ): Promise<OrgFunctionResponseDto> {
    await this.ensureBusinessUnitExists(createOrgFunctionDto.businessUnitId);

    try {
      const orgFunction = await this.prismaService.orgFunction.create({
        data: {
          name: createOrgFunctionDto.name,
          businessUnitId: createOrgFunctionDto.businessUnitId,
        },
      });

      return this.formatOrgFunction(orgFunction);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  async updateFunction(
    id: string,
    updateOrgFunctionDto: UpdateOrgFunctionDto,
  ): Promise<OrgFunctionResponseDto> {
    await this.ensureFunctionExists(id);

    if (updateOrgFunctionDto.businessUnitId) {
      await this.ensureBusinessUnitExists(updateOrgFunctionDto.businessUnitId);
    }

    try {
      const orgFunction = await this.prismaService.orgFunction.update({
        where: { id },
        data: updateOrgFunctionDto,
      });

      return this.formatOrgFunction(orgFunction);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  async findDivisions(query: DivisionQueryDto): Promise<DivisionResponseDto[]> {
    if (query.functionId) {
      await this.ensureFunctionExists(query.functionId);
    }

    const divisions = await this.prismaService.division.findMany({
      where: query.functionId ? { functionId: query.functionId } : undefined,
      orderBy: { name: 'asc' },
    });

    return divisions.map((division) => this.formatDivision(division));
  }

  async createDivision(
    createDivisionDto: CreateDivisionDto,
  ): Promise<DivisionResponseDto> {
    await this.ensureFunctionExists(createDivisionDto.functionId);

    try {
      const division = await this.prismaService.division.create({
        data: {
          name: createDivisionDto.name,
          functionId: createDivisionDto.functionId,
        },
      });

      return this.formatDivision(division);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  async updateDivision(
    id: string,
    updateDivisionDto: UpdateDivisionDto,
  ): Promise<DivisionResponseDto> {
    await this.ensureDivisionExists(id);

    if (updateDivisionDto.functionId) {
      await this.ensureFunctionExists(updateDivisionDto.functionId);
    }

    try {
      const division = await this.prismaService.division.update({
        where: { id },
        data: updateDivisionDto,
      });

      return this.formatDivision(division);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  async findDepartments(
    query: DepartmentQueryDto,
  ): Promise<DepartmentResponseDto[]> {
    if (query.divisionId) {
      await this.ensureDivisionExists(query.divisionId);
    }

    const departments = await this.prismaService.department.findMany({
      where: query.divisionId ? { divisionId: query.divisionId } : undefined,
      orderBy: { name: 'asc' },
    });

    return departments.map((department) => this.formatDepartment(department));
  }

  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    await this.ensureDivisionExists(createDepartmentDto.divisionId);

    try {
      const department = await this.prismaService.department.create({
        data: {
          name: createDepartmentDto.name,
          divisionId: createDepartmentDto.divisionId,
        },
      });

      return this.formatDepartment(department);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  async updateDepartment(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    await this.ensureDepartmentExists(id);

    if (updateDepartmentDto.divisionId) {
      await this.ensureDivisionExists(updateDepartmentDto.divisionId);
    }

    try {
      const department = await this.prismaService.department.update({
        where: { id },
        data: updateDepartmentDto,
      });

      return this.formatDepartment(department);
    } catch (error) {
      this.rethrowDuplicateNameError(error);
      throw error;
    }
  }

  private async ensurePlantExists(id: string) {
    const plant = await this.prismaService.plant.findUnique({
      where: { id },
    });

    if (!plant) {
      throw new NotFoundException('ไม่พบ Plant ที่ระบุ');
    }

    return plant;
  }

  private async ensureBusinessUnitExists(id: string) {
    const businessUnit = await this.prismaService.businessUnit.findUnique({
      where: { id },
    });

    if (!businessUnit) {
      throw new NotFoundException('ไม่พบ Business Unit ที่ระบุ');
    }

    return businessUnit;
  }

  private async ensureFunctionExists(id: string) {
    const orgFunction = await this.prismaService.orgFunction.findUnique({
      where: { id },
    });

    if (!orgFunction) {
      throw new NotFoundException('ไม่พบ Function ที่ระบุ');
    }

    return orgFunction;
  }

  private async ensureDivisionExists(id: string) {
    const division = await this.prismaService.division.findUnique({
      where: { id },
    });

    if (!division) {
      throw new NotFoundException('ไม่พบ Division ที่ระบุ');
    }

    return division;
  }

  private async ensureDepartmentExists(id: string) {
    const department = await this.prismaService.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('ไม่พบ Department ที่ระบุ');
    }

    return department;
  }

  private rethrowDuplicateNameError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('ชื่อหน่วยงานซ้ำภายใต้หน่วยงานแม่เดียวกัน');
    }
  }

  private formatPlant(plant: Plant): PlantResponseDto {
    return {
      id: plant.id,
      name: plant.name,
      createdAt: toIsoDateTime(plant.createdAt),
      updatedAt: toIsoDateTime(plant.updatedAt),
    };
  }

  private formatBusinessUnit(
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

  private formatOrgFunction(orgFunction: OrgFunction): OrgFunctionResponseDto {
    return {
      id: orgFunction.id,
      name: orgFunction.name,
      businessUnitId: orgFunction.businessUnitId,
      createdAt: toIsoDateTime(orgFunction.createdAt),
      updatedAt: toIsoDateTime(orgFunction.updatedAt),
    };
  }

  private formatDivision(division: Division): DivisionResponseDto {
    return {
      id: division.id,
      name: division.name,
      functionId: division.functionId,
      createdAt: toIsoDateTime(division.createdAt),
      updatedAt: toIsoDateTime(division.updatedAt),
    };
  }

  private formatDepartment(department: Department): DepartmentResponseDto {
    return {
      id: department.id,
      name: department.name,
      divisionId: department.divisionId,
      createdAt: toIsoDateTime(department.createdAt),
      updatedAt: toIsoDateTime(department.updatedAt),
    };
  }
}
