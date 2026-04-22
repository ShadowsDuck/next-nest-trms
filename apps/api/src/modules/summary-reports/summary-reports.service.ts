import { SummaryReportSource } from '@workspace/database';
import {
  CreateSummaryReport,
  CreateSummaryReportResponse,
  SummaryReportResponse,
  SummaryReportSnapshot,
  summaryReportResponseSchema,
} from '@workspace/schemas';
import { toIsoDateTime } from 'src/lib/date.mapper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class SummaryReportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly employeesService: EmployeesService,
    private readonly coursesService: CoursesService,
  ) {}

  async createForUser(
    userId: string,
    dto: CreateSummaryReport,
  ): Promise<CreateSummaryReportResponse> {
    if (dto.selectedIds.length === 0) {
      throw new BadRequestException('กรุณาเลือกรายการก่อนสร้างรายงาน');
    }

    const reportSnapshot = await this.buildSnapshot(dto);

    const report = await this.prismaService.$transaction(async (tx) => {
      await tx.summaryReport.deleteMany({
        where: { userId },
      });

      return tx.summaryReport.create({
        data: {
          userId,
          source:
            dto.source === 'employees'
              ? SummaryReportSource.employees
              : SummaryReportSource.courses,
          selectedIds: dto.selectedIds,
          filtersSnapshot: dto.filtersSnapshot,
          reportSnapshot,
        },
      });
    });

    return {
      reportId: report.id,
    };
  }

  async findLatestForUser(userId: string): Promise<SummaryReportResponse> {
    const report = await this.prismaService.summaryReport.findUnique({
      where: { userId },
    });

    if (!report) {
      throw new NotFoundException('ไม่พบรายงานล่าสุด');
    }

    return this.toResponse(report);
  }

  async findByIdForUser(
    userId: string,
    reportId: string,
  ): Promise<SummaryReportResponse> {
    const report = await this.prismaService.summaryReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.userId !== userId) {
      throw new NotFoundException('ไม่พบรายงานที่ต้องการ');
    }

    return this.toResponse(report);
  }

  async deleteByIdForUser(userId: string, reportId: string): Promise<void> {
    const report = await this.prismaService.summaryReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.userId !== userId) {
      throw new NotFoundException('ไม่พบรายงานที่ต้องการ');
    }

    await this.prismaService.summaryReport.delete({
      where: { id: reportId },
    });
  }

  private async buildSnapshot(
    dto: CreateSummaryReport,
  ): Promise<SummaryReportSnapshot> {
    const generatedAt = new Date().toISOString();

    if (dto.source === 'employees') {
      const employees = await this.employeesService.findByEmployeeNosForReport(
        dto.selectedIds,
      );

      if (employees.length === 0) {
        throw new NotFoundException(
          'ไม่พบข้อมูลพนักงานที่เลือกสำหรับสร้างรายงาน',
        );
      }

      return {
        source: 'employees',
        selectedIds: dto.selectedIds,
        generatedAt,
        filtersSnapshot: dto.filtersSnapshot,
        employees,
      };
    }

    const courses = await this.coursesService.findByCourseIdsForReport(
      dto.selectedIds,
    );

    if (courses.length === 0) {
      throw new NotFoundException(
        'ไม่พบข้อมูลหลักสูตรที่เลือกสำหรับสร้างรายงาน',
      );
    }

    return {
      source: 'courses',
      selectedIds: dto.selectedIds,
      generatedAt,
      filtersSnapshot: dto.filtersSnapshot,
      courses,
    };
  }

  private toResponse(report: {
    id: string;
    source: SummaryReportSource;
    selectedIds: unknown;
    filtersSnapshot: unknown;
    reportSnapshot: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): SummaryReportResponse {
    const snapshot = report.reportSnapshot as SummaryReportSnapshot;

    return summaryReportResponseSchema.parse({
      id: report.id,
      source: report.source,
      generatedAt: snapshot.generatedAt,
      selectedIds: report.selectedIds,
      filtersSnapshot: report.filtersSnapshot,
      reportSnapshot: snapshot,
      createdAt: toIsoDateTime(report.createdAt),
      updatedAt: toIsoDateTime(report.updatedAt),
    });
  }
}
