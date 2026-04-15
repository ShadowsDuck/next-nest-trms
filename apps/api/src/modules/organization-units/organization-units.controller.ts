import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrganizationUnitDto } from './dto/create-organization-unit.dto';
import { OrganizationUnitPathResponseDto } from './dto/organization-unit-path-response.dto';
import { OrganizationUnitResponseDto } from './dto/organization-unit-response.dto';
import { UpdateOrganizationUnitDto } from './dto/update-organization-unit.dto';
import { OrganizationUnitsService } from './organization-units.service';

@AllowAnonymous()
@Controller('organization-units')
@ApiTags('Organization Units')
export class OrganizationUnitsController {
  constructor(
    private readonly organizationUnitsService: OrganizationUnitsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างหน่วยงานองค์กร' })
  @ZodResponse({ status: 201, type: OrganizationUnitResponseDto })
  @ApiBadRequestResponse({
    description: 'ข้อมูลไม่ถูกต้องตามกฎโครงสร้างองค์กร',
  })
  @ApiNotFoundResponse({ description: 'ไม่พบหน่วยงานแม่ที่ระบุ' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async create(
    @Body() createOrganizationUnitDto: CreateOrganizationUnitDto,
  ): Promise<OrganizationUnitResponseDto> {
    return await this.organizationUnitsService.create(
      createOrganizationUnitDto,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขหน่วยงานองค์กร' })
  @ZodResponse({ status: 200, type: OrganizationUnitResponseDto })
  @ApiBadRequestResponse({
    description: 'ข้อมูลไม่ถูกต้องตามกฎโครงสร้างองค์กร',
  })
  @ApiNotFoundResponse({ description: 'ไม่พบหน่วยงานที่ระบุ' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationUnitDto: UpdateOrganizationUnitDto,
  ): Promise<OrganizationUnitResponseDto> {
    return await this.organizationUnitsService.update(
      id,
      updateOrganizationUnitDto,
    );
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'ดึงรายการหน่วยงานลูกโดยใช้ parent id' })
  @ZodResponse({ status: 200, type: [OrganizationUnitResponseDto] })
  @ApiNotFoundResponse({ description: 'ไม่พบหน่วยงานแม่ที่ระบุ' })
  async findChildren(
    @Param('id') id: string,
  ): Promise<OrganizationUnitResponseDto[]> {
    return await this.organizationUnitsService.findChildren(id);
  }

  @Get(':id/path')
  @ApiOperation({ summary: 'ดึงเส้นทางจากหน่วยงานปัจจุบันย้อนขึ้นถึง Plant' })
  @ZodResponse({ status: 200, type: OrganizationUnitPathResponseDto })
  @ApiNotFoundResponse({ description: 'ไม่พบหน่วยงานที่ระบุ' })
  async findPathToRoot(
    @Param('id') id: string,
  ): Promise<OrganizationUnitPathResponseDto> {
    return await this.organizationUnitsService.findPathToRoot(id);
  }
}
