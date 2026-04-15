import { JobLevel, OrgUnitLevel, Prefix } from '@workspace/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  const makeService = () => {
    const prismaService = {
      employee: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organizationUnit: {
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

  it('rejects when org unit is not department', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique.mockResolvedValueOnce(null);
    prismaService.organizationUnit.findUnique.mockResolvedValueOnce({
      id: 'div-1',
      level: OrgUnitLevel.Division,
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
        orgUnitId: 'div-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when org unit is not found', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique.mockResolvedValueOnce(null);
    prismaService.organizationUnit.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.create({
        employeeNo: 'EMP001',
        prefix: Prefix.Mr,
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        hireDate: '2026-01-01',
        jobLevel: JobLevel.S1,
        status: 'Active',
        orgUnitId: 'dep-999',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates employee when org unit is department', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique.mockResolvedValueOnce(null);
    prismaService.organizationUnit.findUnique.mockResolvedValueOnce({
      id: 'dep-1',
      level: OrgUnitLevel.Department,
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
      orgUnitId: 'dep-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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
      orgUnitId: 'dep-1',
    });

    expect(result.orgUnitId).toBe('dep-1');
  });
});
