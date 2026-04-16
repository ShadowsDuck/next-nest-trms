import { OrgUnitLevel } from '@workspace/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganizationUnitsService } from './organization-units.service';

describe('OrganizationUnitsService', () => {
  const makeService = () => {
    const prismaService = {
      organizationUnit: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    return {
      prismaService,
      service: new OrganizationUnitsService(prismaService as never),
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates department under division successfully', async () => {
    const { service, prismaService } = makeService();

    prismaService.organizationUnit.findUnique.mockResolvedValueOnce({
      id: 'div-1',
      level: OrgUnitLevel.Division,
      parentId: 'fn-1',
    });

    prismaService.organizationUnit.create.mockResolvedValueOnce({
      id: 'dep-1',
      name: 'ส่วนงานประกอบ A',
      level: OrgUnitLevel.Department,
      parentId: 'div-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.create({
      name: 'ส่วนงานประกอบ A',
      level: OrgUnitLevel.Department,
      parentId: 'div-1',
    });

    expect(result.level).toBe('Department');
    expect(result.parentId).toBe('div-1');
  });

  it('returns root plants only', async () => {
    const { service, prismaService } = makeService();

    prismaService.organizationUnit.findMany.mockResolvedValueOnce([
      {
        id: 'plant-1',
        name: 'Plant Main',
        level: OrgUnitLevel.Plant,
        parentId: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.findPlants();

    expect(prismaService.organizationUnit.findMany).toHaveBeenCalledWith({
      where: {
        level: OrgUnitLevel.Plant,
        parentId: null,
      },
      orderBy: [{ name: 'asc' }],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.level).toBe(OrgUnitLevel.Plant);
  });

  it('rejects invalid hierarchy when creating division under plant', async () => {
    const { service, prismaService } = makeService();

    prismaService.organizationUnit.findUnique.mockResolvedValueOnce({
      id: 'plant-1',
      level: OrgUnitLevel.Plant,
      parentId: null,
    });

    await expect(
      service.create({
        name: 'ฝ่ายประกอบ',
        level: OrgUnitLevel.Division,
        parentId: 'plant-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects update when parent becomes descendant (cycle)', async () => {
    const { service, prismaService } = makeService();

    prismaService.organizationUnit.findUnique
      .mockResolvedValueOnce({
        id: 'fn-1',
        name: 'สายงานการผลิต',
        level: OrgUnitLevel.Function,
        parentId: 'bu-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'div-1',
        level: OrgUnitLevel.Division,
        parentId: 'fn-1',
      })
      .mockResolvedValueOnce({ parentId: 'fn-1' });

    await expect(
      service.update('fn-1', {
        parentId: 'div-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns path from plant to current node', async () => {
    const { service, prismaService } = makeService();

    prismaService.organizationUnit.findUnique
      .mockResolvedValueOnce({
        id: 'dep-1',
        name: 'ส่วนงานประกอบ A',
        level: OrgUnitLevel.Department,
        parentId: 'div-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'div-1',
        name: 'ฝ่ายประกอบ',
        level: OrgUnitLevel.Division,
        parentId: 'fn-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'fn-1',
        name: 'สายงานการผลิต',
        level: OrgUnitLevel.Function,
        parentId: 'bu-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'bu-1',
        name: 'BU Automotive',
        level: OrgUnitLevel.BU,
        parentId: 'plant-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'plant-1',
        name: 'Plant Main',
        level: OrgUnitLevel.Plant,
        parentId: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

    const result = await service.findPathToRoot('dep-1');

    expect(result.path.map((item) => item.level)).toEqual([
      OrgUnitLevel.Plant,
      OrgUnitLevel.BU,
      OrgUnitLevel.Function,
      OrgUnitLevel.Division,
      OrgUnitLevel.Department,
    ]);
  });

  it('throws when requested path id is not found', async () => {
    const { service, prismaService } = makeService();

    prismaService.organizationUnit.findUnique.mockResolvedValueOnce(null);

    await expect(service.findPathToRoot('unknown')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
