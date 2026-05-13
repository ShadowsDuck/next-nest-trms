import { employeeImportRowSchema } from '@workspace/schemas';
import { db } from '../../../lib/db';
import {
  importFieldLabelMap,
  normalizeImportRawRow,
  parseThaiDateToIso,
} from './helpers';
import type { ImportRowValidationResult } from './types';

/**
 * ตรวจสอบความถูกต้องของข้อมูลรายแถว (รวมศูนย์การตรวจสอบทุกระดับ)
 */
export async function validateImportRows(
  rows: any[],
): Promise<ImportRowValidationResult[]> {
  const rowResults = rows.map((rawRow) => validateImportRowSchema(rawRow));
  appendFileDuplicateErrors(rowResults);
  await appendDatabaseDuplicateErrors(rowResults);
  await appendOrganizationChainErrors(rowResults);

  return rowResults;
}

/**
 * ตรวจสอบ Schema ของแถว (Level 1)
 */
function validateImportRowSchema(rawRow: any): ImportRowValidationResult {
  const normalizedRow = normalizeImportRawRow(rawRow);
  const schemaResult = employeeImportRowSchema.safeParse(normalizedRow);
  const errors: string[] = [];

  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      const firstPath = String(issue.path[0] ?? '');
      const fieldLabel = importFieldLabelMap[firstPath];
      errors.push(
        fieldLabel ? `${fieldLabel}: ${issue.message}` : issue.message,
      );
    }
  }

  const parsedRow = schemaResult.success ? schemaResult.data : undefined;

  if (parsedRow?.hireDate) {
    const parsedDate = parseThaiDateToIso(parsedRow.hireDate);
    if (!parsedDate) {
      errors.push(
        'รูปแบบวันที่เริ่มงานไม่ถูกต้อง (ต้องเป็น วว/ดด/ปปปป เช่น 23/04/2569)',
      );
    } else {
      const hireDate = new Date(parsedDate);
      if (hireDate > new Date()) {
        errors.push('วันที่จ้างงานต้องไม่เกินวันปัจจุบัน');
      }
    }
  }

  return {
    sourceRow: normalizedRow.sourceRow,
    employeeNo: normalizedRow.employeeNo,
    parsedRow,
    errors,
  };
}

/**
 * ตรวจสอบข้อมูลซ้ำในไฟล์ (Level 2)
 */
function appendFileDuplicateErrors(rows: ImportRowValidationResult[]) {
  const employeeNoCount = new Map<string, number>();
  const idCardCount = new Map<string, number>();

  for (const row of rows) {
    if (!row.parsedRow) continue;

    const employeeNo = row.parsedRow.employeeNo;
    employeeNoCount.set(employeeNo, (employeeNoCount.get(employeeNo) ?? 0) + 1);

    if (row.parsedRow.idCardNo) {
      const idCardNo = row.parsedRow.idCardNo;
      idCardCount.set(idCardNo, (idCardCount.get(idCardNo) ?? 0) + 1);
    }
  }

  for (const row of rows) {
    if (!row.parsedRow) continue;

    const { employeeNo, idCardNo } = row.parsedRow;
    if ((employeeNoCount.get(employeeNo) ?? 0) > 1) {
      row.errors.push('รหัสพนักงานซ้ำกันภายในไฟล์ CSV');
    }

    if (idCardNo && (idCardCount.get(idCardNo) ?? 0) > 1) {
      row.errors.push('เลขบัตรประชาชนซ้ำกันภายในไฟล์ CSV');
    }
  }
}

/**
 * ตรวจสอบข้อมูลซ้ำในฐานข้อมูล (Level 3)
 */
async function appendDatabaseDuplicateErrors(
  rows: ImportRowValidationResult[],
) {
  const candidateRows = rows.filter((row) => row.parsedRow);
  if (candidateRows.length === 0) return;

  const employeeNos = new Set<string>();
  const idCardNos = new Set<string>();

  for (const row of candidateRows) {
    if (!row.parsedRow) continue;
    employeeNos.add(row.parsedRow.employeeNo);
    if (row.parsedRow.idCardNo) idCardNos.add(row.parsedRow.idCardNo);
  }

  const whereClause =
    idCardNos.size > 0
      ? {
          OR: [
            { employeeNo: { in: [...employeeNos] } },
            { idCardNo: { in: [...idCardNos] } },
          ],
        }
      : { employeeNo: { in: [...employeeNos] } };

  const existingRows = await db.employee.findMany({
    where: whereClause,
    select: { employeeNo: true, idCardNo: true },
  });

  const existingEmployeeNos = new Set(
    existingRows.map((item) => item.employeeNo),
  );
  const existingIdCardNos = new Set(
    existingRows.map((item) => item.idCardNo).filter(Boolean),
  );

  for (const row of candidateRows) {
    if (!row.parsedRow) continue;
    if (existingEmployeeNos.has(row.parsedRow.employeeNo)) {
      row.errors.push('รหัสพนักงานนี้มีอยู่แล้ว');
    }
    if (
      row.parsedRow.idCardNo &&
      existingIdCardNos.has(row.parsedRow.idCardNo)
    ) {
      row.errors.push('รหัสประจำตัวประชาชนนี้มีอยู่แล้ว');
    }
  }
}

/**
 * ตรวจสอบความถูกต้องของสายบังคับบัญชา (Organization Chain)
 */
async function appendOrganizationChainErrors(
  rows: ImportRowValidationResult[],
) {
  for (const row of rows) {
    if (!row.parsedRow || row.errors.length > 0) continue;

    // หมายเหตุ: ตรงนี้เรียก DB helper ที่จะอยู่ใน Service หรือแยกออกมา
    // เพื่อให้ cohesive เราจะย้าย resolveOrganizationUnitIdsByName มาไว้ที่นี่ด้วยถ้าจำเป็น
    // หรือเรียกจาก db โดยตรงในระดับ validation
    const organizationErrors = await getOrganizationChainErrorsByNames({
      plantName: row.parsedRow.plantName,
      buName: row.parsedRow.buName,
      functionName: row.parsedRow.functionName,
      divisionName: row.parsedRow.divisionName,
      departmentName: row.parsedRow.departmentName,
    });
    row.errors.push(...organizationErrors);
  }
}

/**
 * ตรวจสอบความผิดพลาดของสายบังคับบัญชาจากชื่อ
 */
async function getOrganizationChainErrorsByNames(input: {
  plantName: string;
  buName: string;
  functionName: string;
  divisionName: string;
  departmentName: string;
}): Promise<string[]> {
  const plant = await db.plant.findFirst({
    where: { name: input.plantName },
    select: { id: true },
  });
  if (!plant)
    return [
      'ไม่พบความสัมพันธ์ของหน่วยงานจากชื่อที่ระบุ (Plant -> BU -> สายงาน -> ฝ่าย -> ส่วนงาน)',
    ];

  const businessUnit = await db.businessUnit.findFirst({
    where: { plantId: plant.id, name: input.buName },
    select: { id: true },
  });
  if (!businessUnit)
    return [
      'ไม่พบความสัมพันธ์ของหน่วยงานจากชื่อที่ระบุ (Plant -> BU -> สายงาน -> ฝ่าย -> ส่วนงาน)',
    ];

  const orgFunction = await db.orgFunction.findFirst({
    where: { businessUnitId: businessUnit.id, name: input.functionName },
    select: { id: true },
  });
  if (!orgFunction)
    return [
      'ไม่พบความสัมพันธ์ของหน่วยงานจากชื่อที่ระบุ (Plant -> BU -> สายงาน -> ฝ่าย -> ส่วนงาน)',
    ];

  const division = await db.division.findFirst({
    where: { functionId: orgFunction.id, name: input.divisionName },
    select: { id: true },
  });
  if (!division)
    return [
      'ไม่พบความสัมพันธ์ของหน่วยงานจากชื่อที่ระบุ (Plant -> BU -> สายงาน -> ฝ่าย -> ส่วนงาน)',
    ];

  const department = await db.department.findFirst({
    where: { divisionId: division.id, name: input.departmentName },
    select: { id: true },
  });
  if (!department)
    return [
      'ไม่พบความสัมพันธ์ของหน่วยงานจากชื่อที่ระบุ (Plant -> BU -> สายงาน -> ฝ่าย -> ส่วนงาน)',
    ];

  return [];
}

/**
 * ฟังก์ชันช่วยในการหา ID หน่วยงานจากชื่อ (ใช้สำหรับตอนสร้าง payload)
 */
export async function resolveOrganizationUnitIdsByName(input: {
  plantName: string;
  buName: string;
  functionName: string;
  divisionName: string;
  departmentName: string;
}) {
  const plant = await db.plant.findFirst({
    where: { name: input.plantName },
    select: { id: true },
  });
  if (!plant) return null;

  const businessUnit = await db.businessUnit.findFirst({
    where: { plantId: plant.id, name: input.buName },
    select: { id: true },
  });
  if (!businessUnit) return null;

  const orgFunction = await db.orgFunction.findFirst({
    where: { businessUnitId: businessUnit.id, name: input.functionName },
    select: { id: true },
  });
  if (!orgFunction) return null;

  const division = await db.division.findFirst({
    where: { functionId: orgFunction.id, name: input.divisionName },
    select: { id: true },
  });
  if (!division) return null;

  const department = await db.department.findFirst({
    where: { divisionId: division.id, name: input.departmentName },
    select: { id: true },
  });
  if (!department) return null;

  return {
    plantId: plant.id,
    buId: businessUnit.id,
    functionId: orgFunction.id,
    divisionId: division.id,
    departmentId: department.id,
  };
}
