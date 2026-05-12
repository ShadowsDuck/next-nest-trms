import { AuditAction } from '@workspace/database';
import type {
  EmployeeImportDryRunRequest,
  EmployeeImportDryRunResponse,
  EmployeeImportRequest,
  EmployeeImportResponse,
  EmployeeImportRow,
  EmployeeType,
} from '@workspace/schemas';
import type { AuditLogContext } from '../../audit-logs/audit-logs.types';
import {
  createAuditLog,
  createFailureLog,
} from '../../audit-logs/services/audit-logs-write.service';
import { createEmployeeService } from '../services/create-employee.service';
import {
  parseThaiDateToIso,
  splitFullName,
  toAuditErrorPayload,
  toImportAuditPayload,
} from './helpers';
import {
  resolveOrganizationUnitIdsByName,
  validateImportRows,
} from './validation';

/**
 * ตรวจสอบข้อมูลนำเข้าพนักงาน (Dry Run)
 */
export async function importDryRunService(
  body: EmployeeImportDryRunRequest,
): Promise<EmployeeImportDryRunResponse> {
  const validationResults = await validateImportRows(body.rows);
  const valid = validationResults.filter((row) => row.errors.length === 0);
  const invalid = validationResults.length - valid.length;

  return {
    summary: {
      total: validationResults.length,
      valid: valid.length,
      invalid,
    },
    rows: validationResults.map((row) => ({
      sourceRow: row.sourceRow,
      employeeNo: row.employeeNo,
      ok: row.errors.length === 0,
      errors: row.errors,
    })),
  };
}

/**
 * นำเข้าข้อมูลพนักงานจริง (Import)
 */
export async function importEmployeesService(
  body: EmployeeImportRequest,
  auditLogContext: AuditLogContext,
): Promise<EmployeeImportResponse> {
  try {
    const validationResults = await validateImportRows(body.rows);
    const rowResults: EmployeeImportResponse['rows'] = [];
    let imported = 0;

    for (const row of validationResults) {
      if (row.errors.length > 0 || !row.parsedRow) {
        rowResults.push({
          sourceRow: row.sourceRow,
          employeeNo: row.employeeNo,
          ok: false,
          error: row.errors.join(', '),
        });
        continue;
      }

      try {
        const payload = await toCreateEmployeePayload(row.parsedRow);
        await createEmployeeService(payload, auditLogContext);
        imported += 1;
        rowResults.push({
          sourceRow: row.sourceRow,
          employeeNo: row.employeeNo,
          ok: true,
        });
      } catch (error) {
        rowResults.push({
          sourceRow: row.sourceRow,
          employeeNo: row.employeeNo,
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'นำเข้าข้อมูลพนักงานไม่สำเร็จ',
        });
      }
    }

    const response = {
      summary: {
        total: validationResults.length,
        imported,
        failed: validationResults.length - imported,
      },
      rows: rowResults,
    };

    await createAuditLog({
      action: AuditAction.Import,
      model: 'EmployeeImport',
      newValues: {
        request: toImportAuditPayload(body),
        result: response,
      },
      context: auditLogContext,
    });

    if (response.summary.failed > 0) {
      await createAuditLog({
        action: AuditAction.Failed,
        model: 'EmployeeImport',
        newValues: {
          request: toImportAuditPayload(body),
          summary: response.summary,
          failedRows: response.rows.filter((row) => !row.ok),
        },
        context: auditLogContext,
      });
    }

    return response;
  } catch (error) {
    await createFailureLog({
      model: 'EmployeeImport',
      newValues: {
        request: toImportAuditPayload(body),
        error: toAuditErrorPayload(error),
      },
      context: auditLogContext,
    });
    throw error;
  }
}

/**
 * แปลงข้อมูลจากแถวนำเข้าให้เป็น Payload สำหรับสร้างพนักงาน
 */
async function toCreateEmployeePayload(
  row: EmployeeImportRow,
): Promise<EmployeeType> {
  const nameParts = splitFullName(row.fullName);
  if (!nameParts) {
    throw new Error('ชื่อ-นามสกุลไม่ถูกต้อง (กรุณาระบุอย่างน้อย 2 คำ)');
  }

  const organizationUnits = await resolveOrganizationUnitIdsByName({
    plantName: row.plantName,
    buName: row.buName,
    functionName: row.functionName,
    divisionName: row.divisionName,
    departmentName: row.departmentName,
  });

  if (!organizationUnits) {
    throw new Error('ไม่สามารถจับคู่ข้อมูลหน่วยงานจากชื่อได้');
  }

  const hireDateIso = row.hireDate
    ? parseThaiDateToIso(row.hireDate)
    : undefined;
  if (row.hireDate && !hireDateIso) {
    throw new Error(
      'รูปแบบวันที่เริ่มงานไม่ถูกต้อง (ต้องเป็น วว/ดด/ปปปป เช่น 23/04/2569)',
    );
  }

  return {
    employeeNo: row.employeeNo,
    prefix: row.prefix,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    idCardNo: row.idCardNo,
    hireDate: hireDateIso,
    jobLevel: row.jobLevel,
    status: 'Active',
    plantId: organizationUnits.plantId,
    buId: organizationUnits.buId,
    functionId: organizationUnits.functionId,
    divisionId: organizationUnits.divisionId,
    departmentId: organizationUnits.departmentId,
  };
}
