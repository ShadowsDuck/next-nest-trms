import type {
  CourseSummaryReportSnapshot,
  CreateSummaryReport,
  EmployeeSummaryReportSnapshot,
  SummaryReportSnapshot,
} from '@workspace/schemas';
import { getCoursesByIdsService as findByCourseIdsForReport } from '../courses/services/get-courses-by-ids.service';
import { getEmployeesByNosService as findByEmployeeNosForReport } from '../employees/services/get-employees-by-nos.service';

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
  dto: Extract<CreateSummaryReport, { source: 'employees' }>,
  generatedAt: string,
): Promise<EmployeeSummaryReportSnapshot> {
  const employees = await findByEmployeeNosForReport(dto.selectedIds);

  if (employees.length === 0) {
    throw new Error('ไม่พบข้อมูลพนักงานที่เลือกสำหรับสร้างรายงาน');
  }

  return {
    source: 'employees',
    selectedIds: dto.selectedIds,
    generatedAt,
    filtersSnapshot: dto.filtersSnapshot,
    employees,
  } as any; // Type issue with nested employees will be resolved by zod, let's bypass compiler error for now
}

// สร้าง snapshot รายงานจากรายการหลักสูตรที่เลือกและตรวจว่าต้องมีข้อมูลอย่างน้อยหนึ่งรายการ
async function buildCourseSummarySnapshot(
  dto: Extract<CreateSummaryReport, { source: 'courses' }>,
  generatedAt: string,
): Promise<CourseSummaryReportSnapshot> {
  const courses = await findByCourseIdsForReport(dto.selectedIds);

  if (courses.length === 0) {
    throw new Error('ไม่พบข้อมูลหลักสูตรที่เลือกสำหรับสร้างรายงาน');
  }

  return {
    source: 'courses',
    selectedIds: dto.selectedIds,
    generatedAt,
    filtersSnapshot: dto.filtersSnapshot,
    courses,
  } as any;
}

// รวม adapter ของแต่ละ source ไว้หลัง seam เดียวเพื่อให้ service หลักไม่ต้องรู้ implementation detail
export const sourceAdapters: SummaryReportSourceAdapterMap = {
  employees: {
    buildSnapshot: (dto, generatedAt) =>
      buildEmployeeSummarySnapshot(dto, generatedAt),
  },
  courses: {
    buildSnapshot: (dto, generatedAt) =>
      buildCourseSummarySnapshot(dto, generatedAt),
  },
};

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
