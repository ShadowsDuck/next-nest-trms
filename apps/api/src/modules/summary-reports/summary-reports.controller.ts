import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { createSummaryReportSchema } from '@workspace/schemas';
import { ZodResponse } from 'nestjs-zod';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateSummaryReportResponseDto } from './dto/create-summary-report-response.dto';
import { CreateSummaryReportDto } from './dto/create-summary-report.dto';
import { SummaryReportResponseDto } from './dto/summary-report-response.dto';
import { SummaryReportsService } from './summary-reports.service';

@Controller('summary-reports')
@ApiTags('Summary Reports')
export class SummaryReportsController {
  constructor(private readonly summaryReportsService: SummaryReportsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างรายงานสรุปใหม่' })
  @ZodResponse({
    status: 201,
    type: CreateSummaryReportResponseDto,
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  @ApiUnauthorizedResponse({ description: 'เข้าสู่ระบบไม่สำเร็จ' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async create(
    @Session() session: UserSession,
    @Body() createSummaryReportDto: CreateSummaryReportDto,
  ): Promise<CreateSummaryReportResponseDto> {
    return this.summaryReportsService.createForUser(
      session.user.id,
      createSummaryReportSchema.parse(createSummaryReportDto),
    );
  }

  @Get('latest')
  @ApiOperation({ summary: 'ดึงรายงานล่าสุดของผู้ใช้ปัจจุบัน' })
  @ZodResponse({
    status: 200,
    type: SummaryReportResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'เข้าสู่ระบบไม่สำเร็จ' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง' })
  @ApiNotFoundResponse({ description: 'ไม่พบรายงานล่าสุด' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async findLatest(
    @Session() session: UserSession,
  ): Promise<SummaryReportResponseDto> {
    return this.summaryReportsService.findLatestForUser(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายงานตาม reportId' })
  @ZodResponse({
    status: 200,
    type: SummaryReportResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'เข้าสู่ระบบไม่สำเร็จ' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง' })
  @ApiNotFoundResponse({ description: 'ไม่พบรายงานที่ต้องการ' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async findById(
    @Session() session: UserSession,
    @Param('id') reportId: string,
  ): Promise<SummaryReportResponseDto> {
    return this.summaryReportsService.findByIdForUser(
      session.user.id,
      reportId,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'ลบรายงานตาม reportId' })
  @ApiUnauthorizedResponse({ description: 'เข้าสู่ระบบไม่สำเร็จ' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึง' })
  @ApiNotFoundResponse({ description: 'ไม่พบรายงานที่ต้องการ' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async deleteById(
    @Session() session: UserSession,
    @Param('id') reportId: string,
  ): Promise<void> {
    await this.summaryReportsService.deleteByIdForUser(
      session.user.id,
      reportId,
    );
  }
}
