import type { EmployeeDetailResponse } from '@workspace/schemas';
import { formatEmployee } from '../lib/employees.mapper';
import { getEmployeeByNoQuery } from '../queries/get-employee-by-no.query';

/**
 * ดึงรายละเอียดพนักงานตามรหัสพนักงาน
 */
export async function getEmployeeByNoService(
  employeeNo: string,
): Promise<EmployeeDetailResponse> {
  const employee = await getEmployeeByNoQuery(employeeNo);

  if (!employee) {
    throw new Error('ไม่พบข้อมูลพนักงานที่ต้องการ');
  }

  return formatEmployee(employee);
}
