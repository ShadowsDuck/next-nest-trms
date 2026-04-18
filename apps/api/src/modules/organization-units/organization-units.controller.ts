import { ZodResponse } from 'nestjs-zod';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import { OrganizationUnitsService } from './organization-units.service';

@Controller('organization-units')
@ApiTags('Organization Units')
export class OrganizationUnitsController {
  constructor(
    private readonly organizationUnitsService: OrganizationUnitsService,
  ) {}

  @Get('plants')
  @ApiOperation({ summary: 'ดึงรายการ Plant ทั้งหมด' })
  @ZodResponse({ status: 200, type: [PlantResponseDto] })
  async findPlants(): Promise<PlantResponseDto[]> {
    return await this.organizationUnitsService.findPlants();
  }

  @Post('plants')
  @ApiOperation({ summary: 'สร้าง Plant' })
  @ZodResponse({ status: 201, type: PlantResponseDto })
  async createPlant(
    @Body() createPlantDto: CreatePlantDto,
  ): Promise<PlantResponseDto> {
    return await this.organizationUnitsService.createPlant(createPlantDto);
  }

  @Patch('plants/:id')
  @ApiOperation({ summary: 'แก้ไข Plant' })
  @ZodResponse({ status: 200, type: PlantResponseDto })
  @ApiNotFoundResponse({ description: 'ไม่พบ Plant ที่ระบุ' })
  async updatePlant(
    @Param('id') id: string,
    @Body() updatePlantDto: UpdatePlantDto,
  ): Promise<PlantResponseDto> {
    return await this.organizationUnitsService.updatePlant(id, updatePlantDto);
  }

  @Get('business-units')
  @ApiOperation({ summary: 'ดึงรายการ Business Unit โดยรองรับ plantId filter' })
  @ZodResponse({ status: 200, type: [BusinessUnitResponseDto] })
  @ApiNotFoundResponse({ description: 'ไม่พบ Plant ที่ระบุ' })
  async findBusinessUnits(
    @Query() queryDto: BusinessUnitQueryDto,
  ): Promise<BusinessUnitResponseDto[]> {
    return await this.organizationUnitsService.findBusinessUnits(queryDto);
  }

  @Post('business-units')
  @ApiOperation({ summary: 'สร้าง Business Unit' })
  @ZodResponse({ status: 201, type: BusinessUnitResponseDto })
  @ApiConflictResponse({ description: 'ชื่อหน่วยงานซ้ำภายใต้ Plant เดียวกัน' })
  @ApiNotFoundResponse({ description: 'ไม่พบ Plant ที่ระบุ' })
  async createBusinessUnit(
    @Body() createBusinessUnitDto: CreateBusinessUnitDto,
  ): Promise<BusinessUnitResponseDto> {
    return await this.organizationUnitsService.createBusinessUnit(
      createBusinessUnitDto,
    );
  }

  @Patch('business-units/:id')
  @ApiOperation({ summary: 'แก้ไข Business Unit' })
  @ZodResponse({ status: 200, type: BusinessUnitResponseDto })
  @ApiConflictResponse({ description: 'ชื่อหน่วยงานซ้ำภายใต้ Plant เดียวกัน' })
  @ApiNotFoundResponse({
    description: 'ไม่พบ Business Unit หรือ Plant ที่ระบุ',
  })
  async updateBusinessUnit(
    @Param('id') id: string,
    @Body() updateBusinessUnitDto: UpdateBusinessUnitDto,
  ): Promise<BusinessUnitResponseDto> {
    return await this.organizationUnitsService.updateBusinessUnit(
      id,
      updateBusinessUnitDto,
    );
  }

  @Get('functions')
  @ApiOperation({
    summary: 'ดึงรายการ Function โดยรองรับ businessUnitId filter',
  })
  @ZodResponse({ status: 200, type: [OrgFunctionResponseDto] })
  @ApiNotFoundResponse({ description: 'ไม่พบ Business Unit ที่ระบุ' })
  async findFunctions(
    @Query() queryDto: OrgFunctionQueryDto,
  ): Promise<OrgFunctionResponseDto[]> {
    return await this.organizationUnitsService.findFunctions(queryDto);
  }

  @Post('functions')
  @ApiOperation({ summary: 'สร้าง Function' })
  @ZodResponse({ status: 201, type: OrgFunctionResponseDto })
  @ApiConflictResponse({
    description: 'ชื่อหน่วยงานซ้ำภายใต้ Business Unit เดียวกัน',
  })
  @ApiNotFoundResponse({ description: 'ไม่พบ Business Unit ที่ระบุ' })
  async createFunction(
    @Body() createOrgFunctionDto: CreateOrgFunctionDto,
  ): Promise<OrgFunctionResponseDto> {
    return await this.organizationUnitsService.createFunction(
      createOrgFunctionDto,
    );
  }

  @Patch('functions/:id')
  @ApiOperation({ summary: 'แก้ไข Function' })
  @ZodResponse({ status: 200, type: OrgFunctionResponseDto })
  @ApiConflictResponse({
    description: 'ชื่อหน่วยงานซ้ำภายใต้ Business Unit เดียวกัน',
  })
  @ApiNotFoundResponse({
    description: 'ไม่พบ Function หรือ Business Unit ที่ระบุ',
  })
  async updateFunction(
    @Param('id') id: string,
    @Body() updateOrgFunctionDto: UpdateOrgFunctionDto,
  ): Promise<OrgFunctionResponseDto> {
    return await this.organizationUnitsService.updateFunction(
      id,
      updateOrgFunctionDto,
    );
  }

  @Get('divisions')
  @ApiOperation({ summary: 'ดึงรายการ Division โดยรองรับ functionId filter' })
  @ZodResponse({ status: 200, type: [DivisionResponseDto] })
  @ApiNotFoundResponse({ description: 'ไม่พบ Function ที่ระบุ' })
  async findDivisions(
    @Query() queryDto: DivisionQueryDto,
  ): Promise<DivisionResponseDto[]> {
    return await this.organizationUnitsService.findDivisions(queryDto);
  }

  @Post('divisions')
  @ApiOperation({ summary: 'สร้าง Division' })
  @ZodResponse({ status: 201, type: DivisionResponseDto })
  @ApiConflictResponse({
    description: 'ชื่อหน่วยงานซ้ำภายใต้ Function เดียวกัน',
  })
  @ApiNotFoundResponse({ description: 'ไม่พบ Function ที่ระบุ' })
  async createDivision(
    @Body() createDivisionDto: CreateDivisionDto,
  ): Promise<DivisionResponseDto> {
    return await this.organizationUnitsService.createDivision(
      createDivisionDto,
    );
  }

  @Patch('divisions/:id')
  @ApiOperation({ summary: 'แก้ไข Division' })
  @ZodResponse({ status: 200, type: DivisionResponseDto })
  @ApiConflictResponse({
    description: 'ชื่อหน่วยงานซ้ำภายใต้ Function เดียวกัน',
  })
  @ApiNotFoundResponse({ description: 'ไม่พบ Division หรือ Function ที่ระบุ' })
  async updateDivision(
    @Param('id') id: string,
    @Body() updateDivisionDto: UpdateDivisionDto,
  ): Promise<DivisionResponseDto> {
    return await this.organizationUnitsService.updateDivision(
      id,
      updateDivisionDto,
    );
  }

  @Get('departments')
  @ApiOperation({ summary: 'ดึงรายการ Department โดยรองรับ divisionId filter' })
  @ZodResponse({ status: 200, type: [DepartmentResponseDto] })
  @ApiNotFoundResponse({ description: 'ไม่พบ Division ที่ระบุ' })
  async findDepartments(
    @Query() queryDto: DepartmentQueryDto,
  ): Promise<DepartmentResponseDto[]> {
    return await this.organizationUnitsService.findDepartments(queryDto);
  }

  @Post('departments')
  @ApiOperation({ summary: 'สร้าง Department' })
  @ZodResponse({ status: 201, type: DepartmentResponseDto })
  @ApiConflictResponse({
    description: 'ชื่อหน่วยงานซ้ำภายใต้ Division เดียวกัน',
  })
  @ApiNotFoundResponse({ description: 'ไม่พบ Division ที่ระบุ' })
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return await this.organizationUnitsService.createDepartment(
      createDepartmentDto,
    );
  }

  @Patch('departments/:id')
  @ApiOperation({ summary: 'แก้ไข Department' })
  @ZodResponse({ status: 200, type: DepartmentResponseDto })
  @ApiConflictResponse({
    description: 'ชื่อหน่วยงานซ้ำภายใต้ Division เดียวกัน',
  })
  @ApiNotFoundResponse({
    description: 'ไม่พบ Department หรือ Division ที่ระบุ',
  })
  async updateDepartment(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return await this.organizationUnitsService.updateDepartment(
      id,
      updateDepartmentDto,
    );
  }
}
