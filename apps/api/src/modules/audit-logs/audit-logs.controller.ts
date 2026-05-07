import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { auditLogModelOptionsSchema } from '@workspace/schemas';
import { ZodResponse } from 'nestjs-zod';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogModelOptionsDto } from './dto/audit-log-model-options.dto';
import { AuditLogPaginationResponseDto } from './dto/audit-log-pagination-response.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Controller('audit-logs')
@ApiTags('Audit Logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('models')
  @ApiOperation({ summary: 'ดึงรายการโมเดลทั้งหมดของ audit logs' })
  @ZodResponse({
    status: 200,
    type: AuditLogModelOptionsDto,
  })
  @ApiUnauthorizedResponse({
    description: 'เข้าสู่ระบบไม่สำเร็จ',
  })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async findAllModels(@Session() _session: UserSession): Promise<string[]> {
    return auditLogModelOptionsSchema.parse(
      await this.auditLogsService.findAllModels(),
    );
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูล audit logs แบบแบ่งหน้า' })
  @ZodResponse({
    status: 200,
    type: AuditLogPaginationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'ข้อมูล query ไม่ถูกต้อง',
  })
  @ApiUnauthorizedResponse({
    description: 'เข้าสู่ระบบไม่สำเร็จ',
  })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async findAll(
    @Session() _session: UserSession,
    @Query() queryDto: AuditLogQueryDto,
  ): Promise<AuditLogPaginationResponseDto> {
    return await this.auditLogsService.findAll(queryDto);
  }
}
