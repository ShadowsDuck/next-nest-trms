import {
  BusinessUnit,
  Course,
  Department,
  Division,
  Employee,
  OrgFunction,
  Plant,
  Prisma,
  Tag,
  TrainingRecord,
} from '@workspace/database';
import { toIsoDate, toIsoDateTime } from 'src/libs/date.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeePaginationResponseDto } from './dto/employee-pagination-response.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';

type EmployeeWithRelations = Employee & {
  plant: Plant;
  businessUnit: BusinessUnit;
  orgFunction: OrgFunction;
  division: Division;
  department: Department;
  trainingRecords?: (TrainingRecord & {
    course?: Course & {
      tag?: Tag | null;
    };
  })[];
};

@Injectable()
export class EmployeesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const existingEmployeeNo = await this.prismaService.employee.findUnique({
      where: {
        employeeNo: createEmployeeDto.employeeNo,
      },
    });
    if (existingEmployeeNo) {
      throw new ConflictException('รหัสพนักงานนี้มีอยู่แล้ว');
    }

    if (createEmployeeDto.idCardNo) {
      const existingIdCardNo = await this.prismaService.employee.findUnique({
        where: {
          idCardNo: createEmployeeDto.idCardNo,
        },
      });
      if (existingIdCardNo) {
        throw new ConflictException('รหัสประจำตัวประชาชนนี้มีอยู่แล้ว');
      }
    }

    const hireDate = createEmployeeDto.hireDate
      ? new Date(createEmployeeDto.hireDate)
      : null;

    if (hireDate && isNaN(hireDate.getTime())) {
      throw new BadRequestException('รูปแบบวันที่จ้างงานไม่ถูกต้อง');
    }
    if (hireDate && hireDate > new Date()) {
      throw new BadRequestException('วันที่จ้างงานต้องไม่เกินวันปัจจุบัน');
    }

    await this.validateOrganizationChain(createEmployeeDto);

    const employee = await this.prismaService.employee.create({
      data: {
        ...createEmployeeDto,
        hireDate,
      },
      include: {
        plant: true,
        businessUnit: true,
        orgFunction: true,
        division: true,
        department: true,
        trainingRecords: {
          include: {
            course: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    return this.formatEmployee(employee);
  }

  async findAll(
    queryDto: EmployeeQueryDto,
  ): Promise<EmployeePaginationResponseDto> {
    const {
      page,
      limit,
      search,
      prefix,
      jobLevel,
      divisionName,
      departmentName,
      status,
      includeTrainingRecords,
    } = queryDto;

    const where: Prisma.EmployeeWhereInput = {};

    if (prefix && prefix.length > 0) {
      where.prefix = { in: prefix };
    }

    if (jobLevel && jobLevel.length > 0) {
      where.jobLevel = { in: jobLevel };
    }

    if (divisionName && divisionName.length > 0) {
      where.division = {
        name: { in: divisionName },
      };
    }

    if (departmentName && departmentName.length > 0) {
      where.department = {
        name: { in: departmentName },
      };
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (search) {
      where.OR = [
        {
          employeeNo: { contains: search, mode: 'insensitive' },
        },
        {
          firstName: { contains: search, mode: 'insensitive' },
        },
        {
          lastName: { contains: search, mode: 'insensitive' },
        },
        {
          idCardNo: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const [employees, total] = await Promise.all([
      this.prismaService.employee.findMany({
        include: {
          plant: true,
          businessUnit: true,
          orgFunction: true,
          division: true,
          department: true,
          ...(includeTrainingRecords
            ? {
                trainingRecords: {
                  include: {
                    course: {
                      include: {
                        tag: true,
                      },
                    },
                  },
                },
              }
            : {}),
        },
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          employeeNo: 'asc',
        },
      }),
      this.prismaService.employee.count({ where }),
    ]);

    return {
      data: employees.map((employee) => this.formatEmployee(employee)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEmployeeNosForReport(
    employeeNos: string[],
  ): Promise<EmployeeResponseDto[]> {
    if (employeeNos.length === 0) {
      return [];
    }

    const employees = await this.prismaService.employee.findMany({
      where: {
        employeeNo: { in: employeeNos },
      },
      include: {
        plant: true,
        businessUnit: true,
        orgFunction: true,
        division: true,
        department: true,
        trainingRecords: {
          include: {
            course: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    const orderMap = new Map(
      employeeNos.map((employeeNo, index) => [employeeNo, index] as const),
    );

    return employees
      .map((employee) => this.formatEmployee(employee))
      .sort(
        (a, b) =>
          (orderMap.get(a.employeeNo) ?? Number.MAX_SAFE_INTEGER) -
          (orderMap.get(b.employeeNo) ?? Number.MAX_SAFE_INTEGER),
      );
  }

  private formatEmployee(employee: EmployeeWithRelations): EmployeeResponseDto {
    const {
      plant,
      businessUnit,
      orgFunction,
      division,
      department,
      trainingRecords,
      ...employeeData
    } = employee;

    return {
      ...employeeData,
      hireDate: toIsoDate(employee.hireDate),
      createdAt: toIsoDateTime(employee.createdAt),
      updatedAt: toIsoDateTime(employee.updatedAt),
      plantName: plant.name,
      buName: businessUnit.name,
      functionName: orgFunction.name,
      divisionName: division.name,
      departmentName: department.name,
      trainingRecords: (trainingRecords ?? []).map((trainingRecord) => ({
        ...trainingRecord,
        createdAt: toIsoDateTime(trainingRecord.createdAt),
        updatedAt: toIsoDateTime(trainingRecord.updatedAt),
        course: trainingRecord.course
          ? {
              ...trainingRecord.course,
              startDate: toIsoDate(trainingRecord.course.startDate),
              endDate: toIsoDate(trainingRecord.course.endDate),
              startTime: trainingRecord.course.startTime
                ? trainingRecord.course.startTime.toISOString().slice(11, 19)
                : null,
              endTime: trainingRecord.course.endTime
                ? trainingRecord.course.endTime.toISOString().slice(11, 19)
                : null,
              duration: Number(trainingRecord.course.duration),
              expense: Number(trainingRecord.course.expense),
              createdAt: toIsoDateTime(trainingRecord.course.createdAt),
              updatedAt: toIsoDateTime(trainingRecord.course.updatedAt),
              tag: trainingRecord.course.tag
                ? {
                    id: trainingRecord.course.tag.id,
                    name: trainingRecord.course.tag.name,
                    colorCode: trainingRecord.course.tag.colorCode,
                  }
                : undefined,
            }
          : undefined,
      })),
    };
  }

  private async validateOrganizationChain(
    createEmployeeDto: CreateEmployeeDto,
  ) {
    const [plant, businessUnit, orgFunction, division, department] =
      await Promise.all([
        this.prismaService.plant.findUnique({
          where: { id: createEmployeeDto.plantId },
        }),
        this.prismaService.businessUnit.findUnique({
          where: { id: createEmployeeDto.buId },
        }),
        this.prismaService.orgFunction.findUnique({
          where: { id: createEmployeeDto.functionId },
        }),
        this.prismaService.division.findUnique({
          where: { id: createEmployeeDto.divisionId },
        }),
        this.prismaService.department.findUnique({
          where: { id: createEmployeeDto.departmentId },
        }),
      ]);

    if (!plant) {
      throw new BadRequestException('ไม่พบ Plant ที่ระบุ');
    }
    if (!businessUnit) {
      throw new BadRequestException('ไม่พบ Business Unit ที่ระบุ');
    }
    if (!orgFunction) {
      throw new BadRequestException('ไม่พบ Function ที่ระบุ');
    }
    if (!division) {
      throw new BadRequestException('ไม่พบ Division ที่ระบุ');
    }
    if (!department) {
      throw new BadRequestException('ไม่พบ Department ที่ระบุ');
    }

    if (businessUnit.plantId !== createEmployeeDto.plantId) {
      throw new BadRequestException(
        'Business Unit ที่ระบุไม่ได้อยู่ภายใต้ Plant เดียวกัน',
      );
    }

    if (orgFunction.businessUnitId !== createEmployeeDto.buId) {
      throw new BadRequestException(
        'Function ที่ระบุไม่ได้อยู่ภายใต้ Business Unit เดียวกัน',
      );
    }

    if (division.functionId !== createEmployeeDto.functionId) {
      throw new BadRequestException(
        'Division ที่ระบุไม่ได้อยู่ภายใต้ Function เดียวกัน',
      );
    }

    if (department.divisionId !== createEmployeeDto.divisionId) {
      throw new BadRequestException(
        'Department ที่ระบุไม่ได้อยู่ภายใต้ Division เดียวกัน',
      );
    }
  }
}
