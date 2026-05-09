import { BadRequestException } from '@nestjs/common';
import { OrganizationUnitsService } from './organization-units.service';

describe('OrganizationUnitsService', () => {
  const makeService = () => {
    const prismaService = {
      plant: { findUnique: jest.fn() },
      businessUnit: { findUnique: jest.fn() },
      orgFunction: { findUnique: jest.fn() },
      division: { findUnique: jest.fn() },
      department: { findUnique: jest.fn() },
    };

    return {
      prismaService,
      service: new OrganizationUnitsService(prismaService as never),
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a valid employee organization hierarchy', async () => {
    const { service, prismaService } = makeService();

    prismaService.plant.findUnique.mockResolvedValueOnce({ id: 'plant-1' });
    prismaService.businessUnit.findUnique.mockResolvedValueOnce({
      id: 'bu-1',
      plantId: 'plant-1',
    });
    prismaService.orgFunction.findUnique.mockResolvedValueOnce({
      id: 'function-1',
      businessUnitId: 'bu-1',
    });
    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'division-1',
      functionId: 'function-1',
    });
    prismaService.department.findUnique.mockResolvedValueOnce({
      id: 'department-1',
      divisionId: 'division-1',
    });

    await expect(
      service.validateEmployeeHierarchy({
        plantId: 'plant-1',
        buId: 'bu-1',
        functionId: 'function-1',
        divisionId: 'division-1',
        departmentId: 'department-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('throws the existing not-found message when a hierarchy node is missing', async () => {
    const { service, prismaService } = makeService();

    prismaService.plant.findUnique.mockResolvedValueOnce(null);
    prismaService.businessUnit.findUnique.mockResolvedValueOnce({
      id: 'bu-1',
      plantId: 'plant-1',
    });
    prismaService.orgFunction.findUnique.mockResolvedValueOnce({
      id: 'function-1',
      businessUnitId: 'bu-1',
    });
    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'division-1',
      functionId: 'function-1',
    });
    prismaService.department.findUnique.mockResolvedValueOnce({
      id: 'department-1',
      divisionId: 'division-1',
    });

    await expect(
      service.validateEmployeeHierarchy({
        plantId: 'plant-1',
        buId: 'bu-1',
        functionId: 'function-1',
        divisionId: 'division-1',
        departmentId: 'department-1',
      }),
    ).rejects.toEqual(new BadRequestException('ไม่พบ Plant ที่ระบุ'));
  });

  it('throws the existing chain message when parent relationships do not match', async () => {
    const { service, prismaService } = makeService();

    prismaService.plant.findUnique.mockResolvedValueOnce({ id: 'plant-1' });
    prismaService.businessUnit.findUnique.mockResolvedValueOnce({
      id: 'bu-1',
      plantId: 'plant-2',
    });
    prismaService.orgFunction.findUnique.mockResolvedValueOnce({
      id: 'function-1',
      businessUnitId: 'bu-1',
    });
    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'division-1',
      functionId: 'function-1',
    });
    prismaService.department.findUnique.mockResolvedValueOnce({
      id: 'department-1',
      divisionId: 'division-1',
    });

    await expect(
      service.validateEmployeeHierarchy({
        plantId: 'plant-1',
        buId: 'bu-1',
        functionId: 'function-1',
        divisionId: 'division-1',
        departmentId: 'department-1',
      }),
    ).rejects.toEqual(
      new BadRequestException(
        'Business Unit ที่ระบุไม่ได้อยู่ภายใต้ Plant เดียวกัน',
      ),
    );
  });
});
