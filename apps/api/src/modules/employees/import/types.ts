import type { EmployeeImportRow } from '@workspace/schemas';

export type ImportRowValidationResult = {
  sourceRow: number;
  employeeNo?: string;
  parsedRow?: EmployeeImportRow;
  errors: string[];
};

export type NormalizedImportRow = {
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
