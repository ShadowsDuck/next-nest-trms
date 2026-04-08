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
import { EmployeePaginationResponseDto } from './dto/employee-pagination-response.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { EmployeeResponseDto } from './dto/employee-response';
import { EmployeesService } from './employees.service';

@Controller('employees')
@ApiTags('Employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

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
