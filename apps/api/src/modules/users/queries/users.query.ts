import type { UserRole } from '@workspace/database';
import { db } from '../../../lib/db';

/**
 * ค้นหาผู้ใช้งานจากอีเมล
 */
export async function getUserByEmailQuery(email: string) {
  return await db.user.findUnique({
    where: { email },
    include: { employee: true },
  });
}

/**
 * ค้นหาผู้ใช้งานจาก ID
 */
export async function getUserByIdQuery(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
}

/**
 * กำหนดพนักงานให้กับผู้ใช้งาน
 */
export async function assignEmployeeToUserQuery(
  userId: string,
  employeeId: string,
) {
  return await db.user.update({
    where: { id: userId },
    data: { employeeId },
  });
}

/**
 * อัปเดตบทบาทผู้ใช้งาน
 */
export async function updateUserRoleQuery(userId: string, role: UserRole) {
  return await db.user.update({
    where: { id: userId },
    data: { role },
  });
}
