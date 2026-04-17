import { ZodResponse } from 'nestjs-zod';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CoursePaginationResponseDto } from './dto/course-pagination-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';

@Controller('courses')
@ApiTags('Courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

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
