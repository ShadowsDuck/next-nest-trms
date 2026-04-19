import { ZodResponse } from 'nestjs-zod';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagsService } from './tags.service';

@Controller('tags')
@ApiTags('Tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการหมวดหมู่ทั้งหมด' })
  @ZodResponse({
    type: [TagResponseDto],
    status: 200,
  })
  async findAll(): Promise<TagResponseDto[]> {
    return await this.tagsService.findAll();
  }
}
