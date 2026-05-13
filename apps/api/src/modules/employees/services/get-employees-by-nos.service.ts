import type { EmployeeResponse } from '@workspace/schemas';
import { formatEmployee } from '../lib/employees.mapper';
import { getEmployeesByNosQuery } from '../queries/get-employees-by-nos.query';

/**
 * ดึงพนักงานตามรายการรหัสพนักงาน สำหรับการออกรายงาน
 */
export async function getEmployeesByNosService(
  employeeNos: string[],
): Promise<EmployeeResponse[]> {
  if (employeeNos.length === 0) {
    return [];
  }

  const employees = await getEmployeesByNosQuery(employeeNos);

  const orderMap = new Map(
    employeeNos.map((employeeNo, index) => [employeeNo, index] as const),
  );

  return employees
    .map((employee) => formatEmployee(employee))
    .sort(
      (a, b) =>
        (orderMap.get(a.employeeNo) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b.employeeNo) ?? Number.MAX_SAFE_INTEGER),
    );
}
