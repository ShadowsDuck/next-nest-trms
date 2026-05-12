import type { UserRole } from '@workspace/database';
import { db } from '../../lib/db';

// ค้นหาผู้ใช้งานจากอีเมล
export async function findByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    include: { employee: true },
  });
}

// ค้นหาผู้ใช้งานจาก ID
export async function findOne(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
}

// กำหนดพนักงานให้กับผู้ใช้งาน
export async function assignEmployee(userId: string, employeeId: string) {
  return db.user.update({
    where: { id: userId },
    data: { employeeId },
  });
}

// อัปเดตบทบาทผู้ใช้งาน
export async function updateRole(userId: string, role: UserRole) {
  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}
