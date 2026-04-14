import { Course, Employee, Prisma, TrainingRecord } from '@workspace/database';
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

@Injectable()
export class EmployeesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    // เช็ครหัสพนักงานซ้ำ
    const existingEmployeeNo = await this.prismaService.employee.findUnique({
      where: {
        employeeNo: createEmployeeDto.employeeNo,
      },
    });
    if (existingEmployeeNo) {
      throw new ConflictException('รหัสพนักงานนี้มีอยู่แล้ว');
    }

    // เช็คเลขบัตรประชาชนซ้ำ (ถ้ามีการส่งมา)
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

    // ตรวจสอบว่า Date ที่แปลงมา "ใช้ได้จริงไหม" (ป้องกัน Invalid Date)
    if (hireDate && isNaN(hireDate.getTime())) {
      throw new BadRequestException('รูปแบบวันที่จ้างงานไม่ถูกต้อง');
    }
    // ตรวจสอบว่าวันที่จ้างงานต้องไม่เกินวันปัจจุบัน
    if (hireDate && hireDate > new Date()) {
      throw new BadRequestException('วันที่จ้างงานต้องไม่เกินวันปัจจุบัน');
    }

    // เช็คแผนก/สังกัด (Foreign Key org_unit_id)
    // สิ่งที่ต้องทำ: ต้อง Query ไปที่ตาราง OrgUnit เพื่อเช็คว่า ID แผนกที่ส่งมานั้น "มีอยู่จริงในระบบ" หรือไม่ ถ้าไม่มีต้องโยน Error (เช่น NotFoundException 404) ครับ

    const employee = await this.prismaService.employee.create({
      data: {
        ...createEmployeeDto,
        hireDate: hireDate,
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
        ...(includeTrainingRecords
          ? {
              include: {
                trainingRecords: {
                  include: {
                    course: true,
                  },
                },
              },
            }
          : {}),
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

  private formatEmployee(
    employee: Employee & {
      trainingRecords?: (TrainingRecord & {
        course?: Course;
      })[];
    },
  ): EmployeeResponseDto {
    return {
      ...employee,
      hireDate: toIsoDate(employee.hireDate),
      createdAt: toIsoDateTime(employee.createdAt),
      updatedAt: toIsoDateTime(employee.updatedAt),
      trainingRecords: (employee.trainingRecords ?? []).map(
        (trainingRecord) => ({
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
              }
            : undefined,
        }),
      ),
    };
  }
}
