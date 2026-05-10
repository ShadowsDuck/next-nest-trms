import { NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  const makeService = () => {
    const prismaService = {
      employee: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const auditLogsService = {
      create: jest.fn(),
      createFailureLog: jest.fn(),
    };
    const organizationUnitsService = {
      validateEmployeeHierarchy: jest.fn(),
    };

    return {
      prismaService,
      auditLogsService,
      organizationUnitsService,
      service: new EmployeesService(
        prismaService as never,
        auditLogsService as never,
        organizationUnitsService as never,
      ),
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns one employee detail by employeeNo with formatted relations and training records', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique.mockResolvedValueOnce({
      id: 'EMP-ID-001',
      employeeNo: 'EMP-001',
      prefix: 'Mr',
      firstName: 'Ethan',
      lastName: 'Carter',
      idCardNo: '1234567890123',
      hireDate: new Date('2022-01-15'),
      jobLevel: 'S2',
      status: 'Active',
      plantId: 'plant-1',
      buId: 'bu-1',
      functionId: 'function-1',
      divisionId: 'division-1',
      departmentId: 'department-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      plant: { id: 'plant-1', name: 'Plant A' },
      businessUnit: { id: 'bu-1', name: 'BU A' },
      orgFunction: { id: 'function-1', name: 'Function A' },
      division: { id: 'division-1', name: 'Division A' },
      department: { id: 'department-1', name: 'Department A' },
      trainingRecords: [],
    });

    const result = await (service as any).findOneByEmployeeNo('EMP-001');

    expect(result.employeeNo).toBe('EMP-001');
    expect(result.plantName).toBe('Plant A');
    expect(prismaService.employee.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employeeNo: 'EMP-001' },
      }),
    );
  });

  it('throws not found when employeeNo does not exist', async () => {
    const { service, prismaService } = makeService();

    prismaService.employee.findUnique.mockResolvedValueOnce(null);

    await expect(
      (service as any).findOneByEmployeeNo('EMP-404'),
    ).rejects.toEqual(new NotFoundException('ไม่พบข้อมูลพนักงานที่ต้องการ'));
  });
});
