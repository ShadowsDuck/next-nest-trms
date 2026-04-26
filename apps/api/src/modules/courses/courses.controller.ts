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
import { CoursesService } from './courses.service';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';

@Controller('courses')
@ApiTags('Courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างหลักสูตรใหม่' })
  @ZodResponse({
    status: 201,
    type: CourseResponseDto,
    description: 'สร้างหลักสูตรสำเร็จ',
  })
  @ApiBadRequestResponse({
    description: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
  })
  @ApiUnauthorizedResponse({
    description: 'ไม่ได้เข้าสู่ระบบหรือโทเคนไม่ถูกต้อง',
  })
  @ApiForbiddenResponse({
    description: 'ไม่มีสิทธิ์สร้างหลักสูตร',
  })
  @ApiConflictResponse({
    description: 'ข้อมูลหลักสูตรซ้ำกับในระบบ',
  })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  // รับคำขอสร้างหลักสูตรใหม่จากผู้ใช้และส่งต่อให้ service บันทึกข้อมูล
  async create(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    return await this.coursesService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลหลักสูตรทั้งหมด' })
  @ZodResponse({
    type: CoursePaginationResponseDto,
    status: 200,
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  @ApiUnauthorizedResponse({ description: 'เข้าสู่ระบบไม่สำเร็จ' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async findAll(
    @Query() queryDto: CourseQueryDto,
  ): Promise<CoursePaginationResponseDto> {
    return await this.coursesService.findAll(queryDto);
  }
}
