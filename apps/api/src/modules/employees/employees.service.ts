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
import { buildEmployeeWhereInput } from './lib/employee-where.builder';
import { formatEmployee } from './lib/employees.mapper';

@Injectable()
export class EmployeesService {
  constructor(private readonly prismaService: PrismaService) {}

  // สร้างพนักงานใหม่ 1 รายการ พร้อมตรวจข้อมูลซ้ำและความถูกต้องของ chain หน่วยงาน
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

    return formatEmployee(employee);
  }

  // ดึงข้อมูลพนักงานแบบแบ่งหน้า รองรับตัวกรอง และเลือกว่าจะ include training records หรือไม่
  async findAll(
    queryDto: EmployeeQueryDto,
  ): Promise<EmployeePaginationResponseDto> {
    const { page, limit, includeTrainingRecords } = queryDto;
    const where = buildEmployeeWhereInput(queryDto);

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
      data: employees.map((employee) => formatEmployee(employee)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ดึงพนักงานตาม employeeNo หลายรายการ โดยคงลำดับผลลัพธ์ตาม input เดิม
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
      .map((employee) => formatEmployee(employee))
      .sort(
        (a, b) =>
          (orderMap.get(a.employeeNo) ?? Number.MAX_SAFE_INTEGER) -
          (orderMap.get(b.employeeNo) ?? Number.MAX_SAFE_INTEGER),
      );
  }

  // ใช้ตรวจความสัมพันธ์ของหน่วยงานจาก id ก่อนบันทึกพนักงาน
  private async validateOrganizationChain(
    createEmployeeDto: CreateEmployeeDto,
  ) {
    const errors = await this.getOrganizationChainErrors(createEmployeeDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors[0]);
    }
  }

  // ตรวจความสัมพันธ์ chain หน่วยงานจาก id แล้วคืน error list (ไม่ throw)
  private async getOrganizationChainErrors(
    createEmployeeDto: Pick<
      CreateEmployeeDto,
      'plantId' | 'buId' | 'functionId' | 'divisionId' | 'departmentId'
    >,
  ): Promise<string[]> {
    const errors: string[] = [];
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
      errors.push('ไม่พบ Plant ที่ระบุ');
    }
    if (!businessUnit) {
      errors.push('ไม่พบ Business Unit ที่ระบุ');
    }
    if (!orgFunction) {
      errors.push('ไม่พบ Function ที่ระบุ');
    }
    if (!division) {
      errors.push('ไม่พบ Division ที่ระบุ');
    }
    if (!department) {
      errors.push('ไม่พบ Department ที่ระบุ');
    }

    if (errors.length > 0) {
      return errors;
    }

    if (businessUnit.plantId !== createEmployeeDto.plantId) {
      errors.push('Business Unit ที่ระบุไม่ได้อยู่ภายใต้ Plant เดียวกัน');
    }

    if (orgFunction.businessUnitId !== createEmployeeDto.buId) {
      errors.push('Function ที่ระบุไม่ได้อยู่ภายใต้ Business Unit เดียวกัน');
    }

    if (division.functionId !== createEmployeeDto.functionId) {
      errors.push('Division ที่ระบุไม่ได้อยู่ภายใต้ Function เดียวกัน');
    }

    if (department.divisionId !== createEmployeeDto.divisionId) {
      errors.push('Department ที่ระบุไม่ได้อยู่ภายใต้ Division เดียวกัน');
    }

    return errors;
  }
}
