import { OrgUnitLevel, OrganizationUnit } from '@workspace/database';
import { toIsoDateTime } from 'src/libs/date.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationUnitDto } from './dto/create-organization-unit.dto';
import { OrganizationUnitPathResponseDto } from './dto/organization-unit-path-response.dto';
import { OrganizationUnitResponseDto } from './dto/organization-unit-response.dto';
import { UpdateOrganizationUnitDto } from './dto/update-organization-unit.dto';

const expectedParentLevelByLevel: Record<OrgUnitLevel, OrgUnitLevel | null> = {
  Plant: null,
  BU: 'Plant',
  Function: 'BU',
  Division: 'Function',
  Department: 'Division',
};

@Injectable()
export class OrganizationUnitsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createOrganizationUnitDto: CreateOrganizationUnitDto,
  ): Promise<OrganizationUnitResponseDto> {
    await this.validateHierarchy(
      createOrganizationUnitDto.level,
      createOrganizationUnitDto.parentId ?? null,
      null,
    );

    const organizationUnit = await this.prismaService.organizationUnit.create({
      data: {
        name: createOrganizationUnitDto.name,
        level: createOrganizationUnitDto.level,
        parentId: createOrganizationUnitDto.parentId ?? null,
      },
    });

    return this.formatOrganizationUnit(organizationUnit);
  }

  async update(
    id: string,
    updateOrganizationUnitDto: UpdateOrganizationUnitDto,
  ): Promise<OrganizationUnitResponseDto> {
    const existingOrganizationUnit =
      await this.prismaService.organizationUnit.findUnique({
        where: { id },
      });

    if (!existingOrganizationUnit) {
      throw new NotFoundException('ไม่พบหน่วยงานที่ต้องการแก้ไข');
    }

    const nextLevel =
      updateOrganizationUnitDto.level ?? existingOrganizationUnit.level;
    const nextParentId = Object.prototype.hasOwnProperty.call(
      updateOrganizationUnitDto,
      'parentId',
    )
      ? (updateOrganizationUnitDto.parentId ?? null)
      : existingOrganizationUnit.parentId;

    await this.validateHierarchy(nextLevel, nextParentId, id);

    const organizationUnit = await this.prismaService.organizationUnit.update({
      where: { id },
      data: {
        ...(updateOrganizationUnitDto.name
          ? { name: updateOrganizationUnitDto.name }
          : {}),
        ...(updateOrganizationUnitDto.level
          ? { level: updateOrganizationUnitDto.level }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(
          updateOrganizationUnitDto,
          'parentId',
        )
          ? { parentId: updateOrganizationUnitDto.parentId ?? null }
          : {}),
      },
    });

    return this.formatOrganizationUnit(organizationUnit);
  }

  async findChildren(parentId: string): Promise<OrganizationUnitResponseDto[]> {
    const parent = await this.prismaService.organizationUnit.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('ไม่พบหน่วยงานแม่ที่ต้องการค้นหา');
    }

    const children = await this.prismaService.organizationUnit.findMany({
      where: { parentId },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return children.map((child) => this.formatOrganizationUnit(child));
  }

  async findPathToRoot(id: string): Promise<OrganizationUnitPathResponseDto> {
    const path: OrganizationUnit[] = [];

    let current = await this.prismaService.organizationUnit.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('ไม่พบหน่วยงานที่ต้องการค้นหาเส้นทาง');
    }

    while (current) {
      path.push(current);

      if (!current.parentId) {
        break;
      }

      current = await this.prismaService.organizationUnit.findUnique({
        where: { id: current.parentId },
      });
    }

    return {
      path: path.reverse().map((unit) => this.formatOrganizationUnit(unit)),
    };
  }

  private async validateHierarchy(
    level: OrgUnitLevel,
    parentId: string | null,
    currentId: string | null,
  ) {
    // กำหนดว่าระดับปัจจุบัน "ควรมี parent เป็นระดับอะไร"
    // เช่น Department ต้องอยู่ใต้ Division เท่านั้น
    const expectedParentLevel = expectedParentLevelByLevel[level];

    // กรณี Plant: เป็นรากของโครงสร้าง ห้ามมี parent
    if (!expectedParentLevel) {
      if (parentId) {
        throw new BadRequestException('Plant ต้องไม่มีหน่วยงานแม่');
      }
      return;
    }

    // ระดับอื่นที่ไม่ใช่ Plant ต้องมี parent เสมอ
    if (!parentId) {
      throw new BadRequestException(
        `ระดับ ${level} ต้องมีหน่วยงานแม่ระดับ ${expectedParentLevel}`,
      );
    }

    // กันเคส parent เป็นตัวเองตรงๆ
    if (currentId && parentId === currentId) {
      throw new BadRequestException('หน่วยงานไม่สามารถเป็นแม่ของตัวเองได้');
    }

    const parent = await this.prismaService.organizationUnit.findUnique({
      where: { id: parentId },
      select: { id: true, level: true, parentId: true },
    });

    if (!parent) {
      throw new NotFoundException('ไม่พบหน่วยงานแม่ที่ระบุ');
    }

    if (parent.level !== expectedParentLevel) {
      throw new BadRequestException(
        `ระดับ ${level} ต้องอยู่ใต้ระดับ ${expectedParentLevel} เท่านั้น`,
      );
    }

    // ตอน update ต้องกันการย้าย node ไปอยู่ใต้ลูกหลานของตัวเอง (cycle)
    if (currentId) {
      await this.assertParentIsNotDescendant(currentId, parent.id);
    }
  }

  private async assertParentIsNotDescendant(
    currentId: string,
    candidateParentId: string,
  ) {
    // ไล่ parent chain ของ candidateParent ขึ้นไปจนถึงราก
    // ถ้าระหว่างทางเจอ currentId แปลว่ากำลังสร้าง loop ใน tree
    let cursor: string | null = candidateParentId;

    while (cursor) {
      if (cursor === currentId) {
        throw new BadRequestException(
          'ไม่สามารถย้ายหน่วยงานไปอยู่ใต้ลูกหลานของตัวเองได้',
        );
      }

      const node = await this.prismaService.organizationUnit.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });

      cursor = node?.parentId ?? null;
    }
  }

  private formatOrganizationUnit(
    organizationUnit: OrganizationUnit,
  ): OrganizationUnitResponseDto {
    return {
      id: organizationUnit.id,
      name: organizationUnit.name,
      level: organizationUnit.level,
      parentId: organizationUnit.parentId,
      createdAt: toIsoDateTime(organizationUnit.createdAt),
      updatedAt: toIsoDateTime(organizationUnit.updatedAt),
    };
  }
}
