import { JobLevel, Prefix } from '@workspace/database';
import { BadRequestException } from '@nestjs/common';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  const makeService = () => {
    const prismaService = {
      employee: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      plant: {
        findUnique: jest.fn(),
      },
      businessUnit: {
        findUnique: jest.fn(),
      },
      orgFunction: {
        findUnique: jest.fn(),
      },
      division: {
        findUnique: jest.fn(),
      },
      department: {
        findUnique: jest.fn(),
      },
    };

    return {
      prismaService,
      service: new EmployeesService(prismaService as never),
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates employee when organization chain matches', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaService.plant.findUnique.mockResolvedValueOnce({
      id: 'plant-1',
      name: 'Plant Main',
    });
    prismaService.businessUnit.findUnique.mockResolvedValueOnce({
      id: 'bu-1',
      name: 'BU Automotive',
      plantId: 'plant-1',
    });
    prismaService.orgFunction.findUnique.mockResolvedValueOnce({
      id: 'fn-1',
      name: 'Production',
      businessUnitId: 'bu-1',
    });
    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'div-1',
      name: 'Assembly',
      functionId: 'fn-1',
    });
    prismaService.department.findUnique.mockResolvedValueOnce({
      id: 'dep-1',
      name: 'Assembly Line A',
      divisionId: 'div-1',
    });
    prismaService.employee.create.mockResolvedValueOnce({
      id: 'emp-1',
      employeeNo: 'EMP001',
      prefix: Prefix.Mr,
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      idCardNo: null,
      hireDate: new Date('2026-01-01T00:00:00.000Z'),
      jobLevel: JobLevel.S1,
      status: 'Active',
      plantId: 'plant-1',
      buId: 'bu-1',
      functionId: 'fn-1',
      divisionId: 'div-1',
      departmentId: 'dep-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      plant: { id: 'plant-1', name: 'Plant Main' },
      businessUnit: { id: 'bu-1', name: 'BU Automotive', plantId: 'plant-1' },
      orgFunction: {
        id: 'fn-1',
        name: 'Production',
        businessUnitId: 'bu-1',
      },
      division: { id: 'div-1', name: 'Assembly', functionId: 'fn-1' },
      department: { id: 'dep-1', name: 'Assembly Line A', divisionId: 'div-1' },
      trainingRecords: [],
    });

    const result = await service.create({
      employeeNo: 'EMP001',
      prefix: Prefix.Mr,
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      hireDate: '2026-01-01',
      jobLevel: JobLevel.S1,
      status: 'Active',
      plantId: 'plant-1',
      buId: 'bu-1',
      functionId: 'fn-1',
      divisionId: 'div-1',
      departmentId: 'dep-1',
    });

    expect(result.departmentName).toBe('Assembly Line A');
    expect(result.divisionName).toBe('Assembly');
    expect(result.buName).toBe('BU Automotive');
  });

  it('rejects when organization ids do not form a valid chain', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaService.plant.findUnique.mockResolvedValueOnce({
      id: 'plant-1',
      name: 'Plant Main',
    });
    prismaService.businessUnit.findUnique.mockResolvedValueOnce({
      id: 'bu-1',
      name: 'BU Automotive',
      plantId: 'plant-2',
    });
    prismaService.orgFunction.findUnique.mockResolvedValueOnce({
      id: 'fn-1',
      name: 'Production',
      businessUnitId: 'bu-1',
    });
    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'div-1',
      name: 'Assembly',
      functionId: 'fn-1',
    });
    prismaService.department.findUnique.mockResolvedValueOnce({
      id: 'dep-1',
      name: 'Assembly Line A',
      divisionId: 'div-1',
    });

    await expect(
      service.create({
        employeeNo: 'EMP001',
        prefix: Prefix.Mr,
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        hireDate: '2026-01-01',
        jobLevel: JobLevel.S1,
        status: 'Active',
        plantId: 'plant-1',
        buId: 'bu-1',
        functionId: 'fn-1',
        divisionId: 'div-1',
        departmentId: 'dep-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when a required organization resource is missing', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaService.plant.findUnique.mockResolvedValueOnce({
      id: 'plant-1',
      name: 'Plant Main',
    });
    prismaService.businessUnit.findUnique.mockResolvedValueOnce({
      id: 'bu-1',
      name: 'BU Automotive',
      plantId: 'plant-1',
    });
    prismaService.orgFunction.findUnique.mockResolvedValueOnce({
      id: 'fn-1',
      name: 'Production',
      businessUnitId: 'bu-1',
    });
    prismaService.division.findUnique.mockResolvedValueOnce({
      id: 'div-1',
      name: 'Assembly',
      functionId: 'fn-1',
    });
    prismaService.department.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.create({
        employeeNo: 'EMP001',
        prefix: Prefix.Mr,
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        hireDate: '2026-01-01',
        jobLevel: JobLevel.S1,
        status: 'Active',
        plantId: 'plant-1',
        buId: 'bu-1',
        functionId: 'fn-1',
        divisionId: 'div-1',
        departmentId: 'dep-missing',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
