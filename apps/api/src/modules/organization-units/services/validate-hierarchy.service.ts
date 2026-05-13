import { db } from '@/lib/db';
import { throwBadRequest } from '@/lib/http-errors';
import { EmployeeOrganizationHierarchyInput } from '../organization-hierarchy.types';

/**
 * ตรวจสอบความถูกต้องของสายบังคับบัญชา (Organization Chain) ของพนักงาน
 */
export async function validateEmployeeHierarchyService(
  hierarchy: EmployeeOrganizationHierarchyInput,
): Promise<void> {
  const errors = await getEmployeeHierarchyErrors(hierarchy);

  if (errors.length > 0) {
    throwBadRequest(errors[0]);
  }
}

/**
 * ดึงรายการข้อผิดพลาดของสายบังคับบัญชา
 */
async function getEmployeeHierarchyErrors(
  hierarchy: EmployeeOrganizationHierarchyInput,
): Promise<string[]> {
  const errors: string[] = [];
  const [plant, businessUnit, orgFunction, division, department] =
    await Promise.all([
      db.plant.findUnique({
        where: { id: hierarchy.plantId },
      }),
      db.businessUnit.findUnique({
        where: { id: hierarchy.buId },
      }),
      db.orgFunction.findUnique({
        where: { id: hierarchy.functionId },
      }),
      db.division.findUnique({
        where: { id: hierarchy.divisionId },
      }),
      db.department.findUnique({
        where: { id: hierarchy.departmentId },
      }),
    ]);

  if (!plant) {
    errors.push('ไม่พบ Plant ที่ระบุ');
  }
  if (!businessUnit) {
    errors.push('ไม่พบ Business Unit ที่ระบุ');
  }
  if (!orgFunction) {
    errors.push('ไม่พบ Function ที่ระบุ');
  }
  if (!division) {
    errors.push('ไม่พบ Division ที่ระบุ');
  }
  if (!department) {
    errors.push('ไม่พบ Department ที่ระบุ');
  }

  if (errors.length > 0) {
    return errors;
  }

  if (businessUnit && businessUnit.plantId !== hierarchy.plantId) {
    errors.push('Business Unit ที่ระบุไม่ได้อยู่ภายใต้ Plant เดียวกัน');
  }

  if (orgFunction && orgFunction.businessUnitId !== hierarchy.buId) {
    errors.push('Function ที่ระบุไม่ได้อยู่ภายใต้ Business Unit เดียวกัน');
  }

  if (division && division.functionId !== hierarchy.functionId) {
    errors.push('Division ที่ระบุไม่ได้อยู่ภายใต้ Function เดียวกัน');
  }

  if (department && department.divisionId !== hierarchy.divisionId) {
    errors.push('Department ที่ระบุไม่ได้อยู่ภายใต้ Division เดียวกัน');
  }

  return errors;
}
