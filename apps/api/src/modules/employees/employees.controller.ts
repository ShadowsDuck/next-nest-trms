import {
  Session,
  UserHasPermission,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { createAuditLogContext } from '../audit-logs/audit-log-context';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeDetailResponseDto } from './dto/employee-detail-response.dto';
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

  @UserHasPermission({ permission: { employee: ['create'] } })
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
    @Session() session: UserSession,
    @Req() request: Request,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return await this.employeesService.create(
      createEmployeeDto,
      createAuditLogContext(session, request),
    );
  }

  @UserHasPermission({ permission: { employee: ['import'] } })
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

  @UserHasPermission({ permission: { employee: ['import'] } })
  @Post('import')
  @ApiOperation({ summary: 'นำเข้าพนักงานจาก CSV แบบ partial success' })
  @ZodResponse({
    status: 201,
    type: EmployeeImportResponseDto,
    description: 'นำเข้าข้อมูลพนักงานเสร็จสิ้น',
  })
  async importEmployees(
    @Session() session: UserSession,
    @Req() request: Request,
    @Body() body: EmployeeImportRequestDto,
  ): Promise<EmployeeImportResponseDto> {
    return await this.employeeImportService.importEmployees(
      body,
      createAuditLogContext(session, request),
    );
  }

  @UserHasPermission({ permission: { employee: ['read'] } })
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
    @Session() session: UserSession,
    @Req() request: Request,
    @Query() queryDto: EmployeeQueryDto,
  ): Promise<EmployeePaginationResponseDto> {
    return await this.employeesService.findAll(
      queryDto,
      this.isExportRequest(request)
        ? createAuditLogContext(session, request)
        : undefined,
    );
  }

  @UserHasPermission({ permission: { employee: ['read'] } })
  @Get(':employeeNo')
  @ApiOperation({ summary: 'ดึงรายละเอียดพนักงานตามรหัสพนักงาน' })
  @ZodResponse({
    type: EmployeeDetailResponseDto,
    status: 200,
  })
  @ApiBadRequestResponse({
    description: 'ข้อมูลไม่ถูกต้อง',
  })
  @ApiUnauthorizedResponse({
    description: 'เข้าสู่ระบบไม่สำเร็จ',
  })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง (เฉพาะ Admin)' })
  @ApiNotFoundResponse({
    description: 'ไม่พบข้อมูลพนักงานที่ต้องการ',
  })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  // ดึงรายละเอียดพนักงานจาก employeeNo เพื่อใช้บนหน้ารายละเอียดแบบรายบุคคล
  async findOneByEmployeeNo(
    @Session() _session: UserSession,
    @Param('employeeNo') employeeNo: string,
  ): Promise<EmployeeDetailResponseDto> {
    return await this.employeesService.findOneByEmployeeNo(employeeNo);
  }

  // ตรวจว่า request ปัจจุบันถูกเรียกมาเพื่อส่งออกข้อมูลหรือไม่
  private isExportRequest(request: Request): boolean {
    const auditIntent = request.headers['x-audit-intent'];
    const normalizedAuditIntent = Array.isArray(auditIntent)
      ? auditIntent[0]
      : auditIntent;

    return normalizedAuditIntent === 'export';
  }
}
