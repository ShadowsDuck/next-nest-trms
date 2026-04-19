import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@AllowAnonymous()
@SkipThrottle()
@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'ตรวจสอบความพร้อมของระบบ' })
  @ApiOkResponse({
    description: 'ระบบและฐานข้อมูลพร้อมใช้งาน',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({ description: 'ฐานข้อมูลไม่พร้อมใช้งาน' })
  @ApiInternalServerErrorResponse({
    description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  })
  async check(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
