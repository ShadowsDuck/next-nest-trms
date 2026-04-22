import { ZodResponse } from 'nestjs-zod';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeImportDryRunRequestDto } from './dto/employee-import-dry-run-request.dto';
import { EmployeeImportDryRunResponseDto } from './dto/employee-import-dry-run-response.dto';
import { EmployeeImportRequestDto } from './dto/employee-import-request.dto';
import { EmployeeImportResponseDto } from './dto/employee-import-response.dto';
import { EmployeePaginationResponseDto } from './dto/employee-pagination-response.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { EmployeeImportService } from './employee-import.service';
import { EmployeesService } from './employees.service';

@Controller('employees')
@ApiTags('Employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly employeeImportService: EmployeeImportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างพนักงานใหม่ (เฉพาะ Admin)' })
  @ZodResponse({
    status: 201,
    type: EmployeeResponseDto,
    description: 'สร้างพนักงานสำเร็จ',
  })
  @ApiBadRequestResponse({
    description: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
  })
  @ApiUnauthorizedResponse({
    description: 'ไม่ได้เข้าสู่ระบบหรือโทเคนไม่ถูกต้อง',
  })
  @ApiForbiddenResponse({
    description: 'ไม่มีสิทธิ์สร้างพนักงาน (เฉพาะ Admin)',
  })
  @ApiConflictResponse({
    description: 'รหัสพนักงานหรือเลขบัตรประชาชนซ้ำกับในระบบ',
  })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return await this.employeesService.create(createEmployeeDto);
  }

  @Post('import/dry-run')
  @ApiOperation({ summary: 'ตรวจสอบข้อมูลนำเข้าพนักงานจาก CSV (ยังไม่บันทึก)' })
  @ZodResponse({
    status: 200,
    type: EmployeeImportDryRunResponseDto,
    description: 'ตรวจสอบข้อมูลนำเข้าสำเร็จ',
  })
  async importDryRun(
    @Body() body: EmployeeImportDryRunRequestDto,
  ): Promise<EmployeeImportDryRunResponseDto> {
    return await this.employeeImportService.importDryRun(body);
  }

  @Post('import')
  @ApiOperation({ summary: 'นำเข้าพนักงานจาก CSV แบบ partial success' })
  @ZodResponse({
    status: 201,
    type: EmployeeImportResponseDto,
    description: 'นำเข้าข้อมูลพนักงานเสร็จสิ้น',
  })
  async importEmployees(
    @Body() body: EmployeeImportRequestDto,
  ): Promise<EmployeeImportResponseDto> {
    return await this.employeeImportService.importEmployees(body);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลพนักงานทั้งหมด (เฉพาะ Admin)' })
  @ZodResponse({
    type: EmployeePaginationResponseDto,
    status: 200,
  })
  @ApiBadRequestResponse({
    description: 'ข้อมูลไม่ถูกต้อง',
  })
  @ApiUnauthorizedResponse({
    description: 'เข้าสู่ระบบไม่สำเร็จ',
  })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง (เฉพาะ Admin)' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async findAll(
    @Query() queryDto: EmployeeQueryDto,
  ): Promise<EmployeePaginationResponseDto> {
    return await this.employeesService.findAll(queryDto);
  }
}
