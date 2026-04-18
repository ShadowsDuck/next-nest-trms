import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrganizationUnitsService } from './organization-units.service';

describe('OrganizationUnitsService', () => {
  const makeService = () => {
    const prismaService = {
      plant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      businessUnit: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      orgFunction: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      division: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      department: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
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

  it('returns plants ordered by name', async () => {
    const { service, prismaService } = makeService();

    prismaService.plant.findMany.mockResolvedValueOnce([
      {
        id: 'plant-1',
        name: 'Plant Main',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.findPlants();

    expect(prismaService.plant.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(result[0]?.name).toBe('Plant Main');
  });

  it('filters business units by plant id', async () => {
    const { service, prismaService } = makeService();

    prismaService.plant.findUnique.mockResolvedValueOnce({
      id: 'plant-1',
      name: 'Plant Main',
    });
    prismaService.businessUnit.findMany.mockResolvedValueOnce([
      {
        id: 'bu-1',
        name: 'BU Automotive',
        plantId: 'plant-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.findBusinessUnits({ plantId: 'plant-1' });

    expect(prismaService.businessUnit.findMany).toHaveBeenCalledWith({
      where: { plantId: 'plant-1' },
      orderBy: { name: 'asc' },
    });
    expect(result[0]?.plantId).toBe('plant-1');
  });

  it('creates business unit when parent plant exists', async () => {
    const { service, prismaService } = makeService();

    prismaService.plant.findUnique.mockResolvedValueOnce({
      id: 'plant-1',
      name: 'Plant Main',
    });
    prismaService.businessUnit.create.mockResolvedValueOnce({
      id: 'bu-1',
      name: 'BU Automotive',
      plantId: 'plant-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.createBusinessUnit({
      name: 'BU Automotive',
      plantId: 'plant-1',
    });

    expect(result.plantId).toBe('plant-1');
  });

  it('rejects when creating business unit with missing plant', async () => {
    const { service, prismaService } = makeService();

    prismaService.plant.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.createBusinessUnit({
        name: 'BU Automotive',
        plantId: 'plant-404',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate department name inside the same division', async () => {
    const { service, prismaService } = makeService();

    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'div-1',
      name: 'Assembly',
      functionId: 'fn-1',
    });
    prismaService.department.create.mockRejectedValueOnce({ code: 'P2002' });

    await expect(
      service.createDepartment({
        name: 'Assembly Line A',
        divisionId: 'div-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows duplicate department name under different divisions', async () => {
    const { service, prismaService } = makeService();

    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'div-2',
      name: 'Paint',
      functionId: 'fn-1',
    });
    prismaService.department.create.mockResolvedValueOnce({
      id: 'dep-2',
      name: 'Shared Name',
      divisionId: 'div-2',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.createDepartment({
      name: 'Shared Name',
      divisionId: 'div-2',
    });

    expect(result.divisionId).toBe('div-2');
    expect(result.name).toBe('Shared Name');
  });
});
