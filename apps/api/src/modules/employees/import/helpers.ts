import type { EmployeeImportRequest, EmployeeType } from '@workspace/schemas';
import type { NormalizedImportRow } from './types';

export const importFieldLabelMap: Record<string, string> = {
  sourceRow: 'ลำดับแถว',
  employeeNo: 'รหัสพนักงาน',
  prefix: 'คำนำหน้า',
  fullName: 'ชื่อ-นามสกุล',
  idCardNo: 'บัตรประชาชน',
  hireDate: 'วันที่เริ่มงาน',
  jobLevel: 'ระดับงาน',
  plantName: 'Plant',
  buName: 'BU',
  functionName: 'สายงาน',
  divisionName: 'ฝ่าย',
  departmentName: 'ส่วนงาน',
};

/**
 * ปรับข้อมูลดิบให้เป็นรูปแบบมาตรฐาน
 */
export function normalizeImportRawRow(rawRow: any): NormalizedImportRow {
  return {
    sourceRow: Number(rawRow.sourceRow),
    employeeNo: normalizeString(rawRow.employeeNo),
    prefix: normalizePrefix(rawRow.prefix),
    fullName: normalizeString(rawRow.fullName),
    idCardNo: normalizeString(rawRow.idCardNo),
    hireDate: normalizeString(rawRow.hireDate),
    jobLevel: normalizeString(rawRow.jobLevel),
    plantName: normalizeString(rawRow.plantName),
    buName: normalizeString(rawRow.buName),
    functionName: normalizeString(rawRow.functionName),
    divisionName: normalizeString(rawRow.divisionName),
    departmentName: normalizeString(rawRow.departmentName),
  };
}

/**
 * ปรับ String ให้เรียบร้อย (Trim และจัดการ Null)
 */
export function normalizeString(value: unknown): string | undefined {
  if (
    value == null ||
    (typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean' &&
      typeof value !== 'bigint')
  ) {
    return undefined;
  }

  const normalized =
    typeof value === 'string' ? value.trim() : value.toString().trim();
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * ปรับคำนำหน้าชื่อให้เป็นค่ามาตรฐาน
 */
export function normalizePrefix(
  value: unknown,
): EmployeeType['prefix'] | undefined {
  const raw = normalizeString(value);
  if (!raw) {
    return undefined;
  }

  if (raw === 'นาย' || raw.toLowerCase() === 'mr') {
    return 'Mr';
  }
  if (raw === 'นาง' || raw.toLowerCase() === 'mrs') {
    return 'Mrs';
  }
  if (raw === 'นางสาว' || raw.toLowerCase() === 'miss') {
    return 'Miss';
  }

  return undefined;
}

/**
 * แยกชื่อและนามสกุลออกจากกัน
 */
export function splitFullName(
  fullName: string,
): { firstName: string; lastName: string } | null {
  const normalized = fullName.trim();
  if (normalized.length === 0) {
    return null;
  }

  if (normalized.includes('-')) {
    const [firstName, ...rest] = normalized
      .split('-')
      .map((part) => part.trim())
      .filter(Boolean);
    const lastName = rest.join(' ').trim();

    if (!firstName || !lastName) {
      return null;
    }

    return { firstName, lastName };
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * แปลงวันที่แบบไทยเป็น ISO (YYYY-MM-DD)
 */
export function parseThaiDateToIso(value: string): string | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const buddhistYear = Number(match[3]);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(buddhistYear)
  ) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || buddhistYear < 2400) {
    return null;
  }

  const gregorianYear = buddhistYear - 543;
  const date = new Date(Date.UTC(gregorianYear, month - 1, day));

  if (
    date.getUTCFullYear() !== gregorianYear ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${gregorianYear.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * สร้าง Audit Payload สำหรับการนำเข้า
 */
export function toImportAuditPayload(
  body: EmployeeImportRequest,
): Record<string, unknown> {
  return {
    totalRows: body.rows.length,
    rows: body.rows,
  };
}

/**
 * สรุปข้อผิดพลาดให้อยู่ในรูปแบบ JSON
 */
export function toAuditErrorPayload(error: unknown): Record<string, string> {
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
