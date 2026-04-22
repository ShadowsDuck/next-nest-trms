import {
  type EmployeeImportRawRow,
  type EmployeeImportResponse,
  type EmployeeImportRow,
  type EmployeeType,
  employeeImportRowSchema,
} from '@workspace/schemas';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeImportDryRunRequestDto } from './dto/employee-import-dry-run-request.dto';
import { EmployeeImportDryRunResponseDto } from './dto/employee-import-dry-run-response.dto';
import { EmployeeImportRequestDto } from './dto/employee-import-request.dto';
import { EmployeeImportResponseDto } from './dto/employee-import-response.dto';
import { EmployeesService } from './employees.service';

@Injectable()
export class EmployeeImportService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  private static readonly importFieldLabelMap: Record<string, string> = {
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

  // ตรวจไฟล์นำเข้าแบบไม่บันทึกข้อมูลจริง แล้วส่งผลสรุปต่อแถวกลับไปให้ผู้ใช้
  async importDryRun(
    body: EmployeeImportDryRunRequestDto,
  ): Promise<EmployeeImportDryRunResponseDto> {
    const validationResults = await this.validateImportRows(body.rows);
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

  // นำเข้าข้อมูลจริงจาก CSV แบบ partial success (แถวที่ผิดจะถูกข้าม)
  async importEmployees(
    body: EmployeeImportRequestDto,
  ): Promise<EmployeeImportResponseDto> {
    const validationResults = await this.validateImportRows(body.rows);
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
        const payload = await this.toCreateEmployeePayload(row.parsedRow);
        await this.employeesService.create(payload);
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

    return {
      summary: {
        total: validationResults.length,
        imported,
        failed: validationResults.length - imported,
      },
      rows: rowResults,
    };
  }

  // ขั้นตอนตรวจนำเข้า: schema -> ซ้ำในไฟล์ -> ซ้ำในฐาน -> ความสัมพันธ์หน่วยงาน
  private async validateImportRows(
    rows: EmployeeImportRawRow[],
  ): Promise<ImportRowValidationResult[]> {
    const rowResults = rows.map((rawRow) =>
      this.validateImportRowSchema(rawRow),
    );
    this.appendFileDuplicateErrors(rowResults);
    await this.appendDatabaseDuplicateErrors(rowResults);
    await this.appendOrganizationChainErrors(rowResults);

    return rowResults;
  }

  // normalize ก่อน parse เพื่อให้ error report สะอาดและคาดเดาได้
  private validateImportRowSchema(
    rawRow: EmployeeImportRawRow,
  ): ImportRowValidationResult {
    const normalizedRow = this.normalizeImportRawRow(rawRow);
    const schemaResult = employeeImportRowSchema.safeParse(normalizedRow);
    const errors: string[] = [];

    if (!schemaResult.success) {
      for (const issue of schemaResult.error.issues) {
        const firstPath = String(issue.path[0] ?? '');
        const fieldLabel = EmployeeImportService.importFieldLabelMap[firstPath];
        errors.push(
          fieldLabel ? `${fieldLabel}: ${issue.message}` : issue.message,
        );
      }
    }

    const parsedRow = schemaResult.success ? schemaResult.data : undefined;

    if (parsedRow?.hireDate) {
      const parsedDate = this.parseThaiDateToIso(parsedRow.hireDate);
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

  // ตรวจ duplicate ภายในไฟล์เดียวกัน โดยดู employeeNo และ idCardNo
  private appendFileDuplicateErrors(rows: ImportRowValidationResult[]) {
    const employeeNoCount = new Map<string, number>();
    const idCardCount = new Map<string, number>();

    for (const row of rows) {
      if (!row.parsedRow) {
        continue;
      }

      const employeeNo = row.parsedRow.employeeNo;
      employeeNoCount.set(
        employeeNo,
        (employeeNoCount.get(employeeNo) ?? 0) + 1,
      );

      if (row.parsedRow.idCardNo) {
        const idCardNo = row.parsedRow.idCardNo;
        idCardCount.set(idCardNo, (idCardCount.get(idCardNo) ?? 0) + 1);
      }
    }

    for (const row of rows) {
      if (!row.parsedRow) {
        continue;
      }

      const { employeeNo, idCardNo } = row.parsedRow;
      if ((employeeNoCount.get(employeeNo) ?? 0) > 1) {
        row.errors.push('รหัสพนักงานซ้ำกันภายในไฟล์ CSV');
      }

      if (idCardNo && (idCardCount.get(idCardNo) ?? 0) > 1) {
        row.errors.push('เลขบัตรประชาชนซ้ำกันภายในไฟล์ CSV');
      }
    }
  }

  // ตรวจ duplicate กับข้อมูลที่มีอยู่ในระบบก่อนนำเข้า
  private async appendDatabaseDuplicateErrors(
    rows: ImportRowValidationResult[],
  ) {
    const candidateRows = rows.filter((row) => row.parsedRow);

    if (candidateRows.length === 0) {
      return;
    }

    const employeeNos = new Set<string>();
    const idCardNos = new Set<string>();

    for (const row of candidateRows) {
      if (!row.parsedRow) {
        continue;
      }

      employeeNos.add(row.parsedRow.employeeNo);
      if (row.parsedRow.idCardNo) {
        idCardNos.add(row.parsedRow.idCardNo);
      }
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

    const existingRows = await this.prismaService.employee.findMany({
      where: whereClause,
      select: {
        employeeNo: true,
        idCardNo: true,
      },
    });

    const existingEmployeeNos = new Set(
      existingRows.map((item) => item.employeeNo),
    );
    const existingIdCardNos = new Set(
      existingRows.map((item) => item.idCardNo).filter(Boolean),
    );

    for (const row of candidateRows) {
      if (!row.parsedRow) {
        continue;
      }

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

  // ตรวจว่า chain หน่วยงานจากชื่อสามารถ map ได้จริงทุกระดับ
  private async appendOrganizationChainErrors(
    rows: ImportRowValidationResult[],
  ) {
    for (const row of rows) {
      if (!row.parsedRow || row.errors.length > 0) {
        continue;
      }

      const organizationErrors = await this.getOrganizationChainErrorsByNames({
        plantName: row.parsedRow.plantName,
        buName: row.parsedRow.buName,
        functionName: row.parsedRow.functionName,
        divisionName: row.parsedRow.divisionName,
        departmentName: row.parsedRow.departmentName,
      });
      row.errors.push(...organizationErrors);
    }
  }

  // normalize และ map ฟิลด์จากข้อมูลดิบที่อ่านจาก CSV
  private normalizeImportRawRow(
    rawRow: EmployeeImportRawRow,
  ): NormalizedImportRow {
    return {
      sourceRow: Number(rawRow.sourceRow),
      employeeNo: this.normalizeString(rawRow.employeeNo),
      prefix: this.normalizePrefix(rawRow.prefix),
      fullName: this.normalizeString(rawRow.fullName),
      idCardNo: this.normalizeString(rawRow.idCardNo),
      hireDate: this.normalizeString(rawRow.hireDate),
      jobLevel: this.normalizeString(rawRow.jobLevel),
      plantName: this.normalizeString(rawRow.plantName),
      buName: this.normalizeString(rawRow.buName),
      functionName: this.normalizeString(rawRow.functionName),
      divisionName: this.normalizeString(rawRow.divisionName),
      departmentName: this.normalizeString(rawRow.departmentName),
    };
  }

  // แปลง primitive เป็น string แบบ trim และกันค่าที่ไม่ควรถูกนำมา stringify
  private normalizeString(value: unknown): string | undefined {
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

  // map คำนำหน้าภาษาไทย/อังกฤษให้เป็นค่ามาตรฐานที่ schema รองรับ
  private normalizePrefix(value: unknown): EmployeeType['prefix'] | undefined {
    const raw = this.normalizeString(value);
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

  // แปลงข้อมูลนำเข้าจาก CSV ให้พร้อมสำหรับ create employee โดย map ชื่อหน่วยงาน -> id
  private async toCreateEmployeePayload(
    row: EmployeeImportRow,
  ): Promise<CreateEmployeeDto> {
    const nameParts = this.splitFullName(row.fullName);
    if (!nameParts) {
      throw new BadRequestException(
        'ชื่อ-นามสกุลไม่ถูกต้อง (กรุณาระบุอย่างน้อย 2 คำ)',
      );
    }

    const organizationUnits = await this.resolveOrganizationUnitIdsByName({
      plantName: row.plantName,
      buName: row.buName,
      functionName: row.functionName,
      divisionName: row.divisionName,
      departmentName: row.departmentName,
    });

    if (!organizationUnits) {
      throw new BadRequestException('ไม่สามารถจับคู่ข้อมูลหน่วยงานจากชื่อได้');
    }

    const hireDateIso = row.hireDate
      ? this.parseThaiDateToIso(row.hireDate)
      : undefined;
    if (row.hireDate && !hireDateIso) {
      throw new BadRequestException(
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

  // แยก "ชื่อ-นามสกุล" เป็น firstName/lastName โดยรองรับทั้งรูปแบบเว้นวรรคและคั่นด้วย "-"
  private splitFullName(
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

  // แปลงวันที่รูปแบบไทย (วว/ดด/ปปปป พ.ศ.) ให้เป็น ISO date (yyyy-mm-dd)
  private parseThaiDateToIso(value: string): string | null {
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

  // หา id หน่วยงานจาก "ชื่อ" โดยไล่ตาม chain: plant -> bu -> function -> division -> department
  private async resolveOrganizationUnitIdsByName(input: {
    plantName: string;
    buName: string;
    functionName: string;
    divisionName: string;
    departmentName: string;
  }): Promise<{
    plantId: string;
    buId: string;
    functionId: string;
    divisionId: string;
    departmentId: string;
  } | null> {
    const plant = await this.prismaService.plant.findFirst({
      where: { name: input.plantName },
      select: { id: true },
    });
    if (!plant) {
      return null;
    }

    const businessUnit = await this.prismaService.businessUnit.findFirst({
      where: {
        plantId: plant.id,
        name: input.buName,
      },
      select: { id: true },
    });
    if (!businessUnit) {
      return null;
    }

    const orgFunction = await this.prismaService.orgFunction.findFirst({
      where: {
        businessUnitId: businessUnit.id,
        name: input.functionName,
      },
      select: { id: true },
    });
    if (!orgFunction) {
      return null;
    }

    const division = await this.prismaService.division.findFirst({
      where: {
        functionId: orgFunction.id,
        name: input.divisionName,
      },
      select: { id: true },
    });
    if (!division) {
      return null;
    }

    const department = await this.prismaService.department.findFirst({
      where: {
        divisionId: division.id,
        name: input.departmentName,
      },
      select: { id: true },
    });
    if (!department) {
      return null;
    }

    return {
      plantId: plant.id,
      buId: businessUnit.id,
      functionId: orgFunction.id,
      divisionId: division.id,
      departmentId: department.id,
    };
  }

  // ตรวจสอบความถูกต้องของ chain หน่วยงานจาก "ชื่อ" เพื่อใช้ใน dry-run
  private async getOrganizationChainErrorsByNames(input: {
    plantName: string;
    buName: string;
    functionName: string;
    divisionName: string;
    departmentName: string;
  }): Promise<string[]> {
    const organizationUnits =
      await this.resolveOrganizationUnitIdsByName(input);
    if (organizationUnits) {
      return [];
    }

    return [
      'ไม่พบความสัมพันธ์ของหน่วยงานจากชื่อที่ระบุ (Plant -> BU -> สายงาน -> ฝ่าย -> ส่วนงาน)',
    ];
  }
}

type ImportRowValidationResult = {
  sourceRow: number;
  employeeNo?: string;
  parsedRow?: EmployeeImportRow;
  errors: string[];
};

type NormalizedImportRow = {
  sourceRow: number;
  employeeNo?: string;
  prefix?: string;
  fullName?: string;
  idCardNo?: string;
  hireDate?: string;
  jobLevel?: string;
  plantName?: string;
  buName?: string;
  functionName?: string;
  divisionName?: string;
  departmentName?: string;
};
