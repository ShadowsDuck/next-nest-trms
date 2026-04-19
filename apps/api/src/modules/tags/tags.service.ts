import { TagResponse } from '@workspace/schemas';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TagsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<TagResponse[]> {
    const tags = await this.prismaService.tag.findMany({
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      colorCode: tag.colorCode,
    }));
  }
}
