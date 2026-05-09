import type {
  CourseSummaryReportSnapshot,
  CreateSummaryReport,
  EmployeeSummaryReportSnapshot,
  SummaryReportSnapshot,
} from '@workspace/schemas';
import { NotFoundException } from '@nestjs/common';
import type { CoursesService } from '../courses/courses.service';
import type { EmployeesService } from '../employees/employees.service';

type SummaryReportSourceAdapterMap = {
  employees: {
    buildSnapshot: (
      dto: Extract<CreateSummaryReport, { source: 'employees' }>,
      generatedAt: string,
    ) => Promise<EmployeeSummaryReportSnapshot>;
  };
  courses: {
    // สร้าง snapshot รายงานจากรายการหลักสูตรที่เลือกและตรวจว่าต้องมีข้อมูลอย่างน้อยหนึ่งรายการ
    buildSnapshot: (
      dto: Extract<CreateSummaryReport, { source: 'courses' }>,
      generatedAt: string,
    ) => Promise<CourseSummaryReportSnapshot>;
  };
};

// สร้าง snapshot รายงานจากรายการพนักงานที่เลือกและตรวจว่าต้องมีข้อมูลอย่างน้อยหนึ่งรายการ
async function buildEmployeeSummarySnapshot(
  employeesService: EmployeesService,
  dto: Extract<CreateSummaryReport, { source: 'employees' }>,
  generatedAt: string,
): Promise<EmployeeSummaryReportSnapshot> {
  const employees = await employeesService.findByEmployeeNosForReport(
    dto.selectedIds,
  );

  if (employees.length === 0) {
    throw new NotFoundException('ไม่พบข้อมูลพนักงานที่เลือกสำหรับสร้างรายงาน');
  }

  return {
    source: 'employees',
    selectedIds: dto.selectedIds,
    generatedAt,
    filtersSnapshot: dto.filtersSnapshot,
    employees,
  };
}

// สร้าง snapshot รายงานจากรายการหลักสูตรที่เลือกและตรวจว่าต้องมีข้อมูลอย่างน้อยหนึ่งรายการ
async function buildCourseSummarySnapshot(
  coursesService: CoursesService,
  dto: Extract<CreateSummaryReport, { source: 'courses' }>,
  generatedAt: string,
): Promise<CourseSummaryReportSnapshot> {
  const courses = await coursesService.findByCourseIdsForReport(
    dto.selectedIds,
  );

  if (courses.length === 0) {
    throw new NotFoundException('ไม่พบข้อมูลหลักสูตรที่เลือกสำหรับสร้างรายงาน');
  }

  return {
    source: 'courses',
    selectedIds: dto.selectedIds,
    generatedAt,
    filtersSnapshot: dto.filtersSnapshot,
    courses,
  };
}

// รวม adapter ของแต่ละ source ไว้หลัง seam เดียวเพื่อให้ service หลักไม่ต้องรู้ implementation detail
export function buildSummaryReportSourceAdapters(
  employeesService: EmployeesService,
  coursesService: CoursesService,
): SummaryReportSourceAdapterMap {
  return {
    employees: {
      buildSnapshot: (dto, generatedAt) =>
        buildEmployeeSummarySnapshot(employeesService, dto, generatedAt),
    },
    courses: {
      buildSnapshot: (dto, generatedAt) =>
        buildCourseSummarySnapshot(coursesService, dto, generatedAt),
    },
  };
}

// เลือก adapter ให้ตรงกับ source ของคำขอเพื่อสร้าง snapshot โดยไม่ branch ใน service หลัก
export async function buildSummaryReportSnapshot(
  adapters: SummaryReportSourceAdapterMap,
  dto: CreateSummaryReport,
  generatedAt: string,
): Promise<SummaryReportSnapshot> {
  if (dto.source === 'employees') {
    return adapters.employees.buildSnapshot(dto, generatedAt);
  }

  return adapters.courses.buildSnapshot(dto, generatedAt);
}
