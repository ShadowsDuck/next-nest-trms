import { AuditAction, SummaryReportSource } from '@workspace/database';
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
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuditLogContext } from '../audit-logs/audit-logs.types';
import { CoursesService } from '../courses/courses.service';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class SummaryReportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly employeesService: EmployeesService,
    private readonly coursesService: CoursesService,
  ) {}

  async createForUser(
    userId: string,
    dto: CreateSummaryReport,
    auditLogContext: AuditLogContext,
  ): Promise<CreateSummaryReportResponse> {
    try {
      if (dto.selectedIds.length === 0) {
        throw new BadRequestException('กรุณาเลือกรายการก่อนสร้างรายงาน');
      }

      const previousReport = await this.prismaService.summaryReport.findUnique({
        where: { userId },
      });
      const reportSnapshot = await this.buildSnapshot(dto);

      const report = await this.prismaService.$transaction(async (tx) => {
        if (previousReport) {
          await tx.summaryReport.delete({
            where: { id: previousReport.id },
          });

          await this.auditLogsService.create(
            {
              action: AuditAction.Delete,
              model: 'SummaryReport',
              recordId: previousReport.id,
              oldValues: previousReport,
              context: auditLogContext,
            },
            tx,
          );
        }

        const createdReport = await tx.summaryReport.create({
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

        await this.auditLogsService.create(
          {
            action: AuditAction.Create,
            model: 'SummaryReport',
            recordId: createdReport.id,
            newValues: createdReport,
            context: auditLogContext,
          },
          tx,
        );

        return createdReport;
      });

      return {
        reportId: report.id,
      };
    } catch (error) {
      await this.auditLogsService.createFailureLog({
        model: 'SummaryReport',
        newValues: {
          source: dto.source,
          selectedIds: dto.selectedIds,
          filtersSnapshot: dto.filtersSnapshot,
          error: this.toAuditErrorPayload(error),
        },
        context: auditLogContext,
      });
      throw error;
    }
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

  async deleteByIdForUser(
    userId: string,
    reportId: string,
    auditLogContext: AuditLogContext,
  ): Promise<void> {
    try {
      const report = await this.prismaService.summaryReport.findUnique({
        where: { id: reportId },
      });

      if (!report || report.userId !== userId) {
        throw new NotFoundException('ไม่พบรายงานที่ต้องการ');
      }

      await this.prismaService.$transaction(async (tx) => {
        await tx.summaryReport.delete({
          where: { id: reportId },
        });

        await this.auditLogsService.create(
          {
            action: AuditAction.Delete,
            model: 'SummaryReport',
            recordId: report.id,
            oldValues: report,
            context: auditLogContext,
          },
          tx,
        );
      });
    } catch (error) {
      await this.auditLogsService.createFailureLog({
        model: 'SummaryReport',
        recordId: reportId,
        newValues: {
          error: this.toAuditErrorPayload(error),
        },
        context: auditLogContext,
      });
      throw error;
    }
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

  // สรุปข้อผิดพลาดให้อยู่ในรูปแบบ JSON ที่อ่านย้อนหลังได้ง่าย
  private toAuditErrorPayload(error: unknown): Record<string, string> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    return {
      name: 'UnknownError',
      message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    };
  }
}
