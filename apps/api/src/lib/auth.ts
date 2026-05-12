import { prisma } from '@workspace/database';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';
import { env } from '../env';

const ac = createAccessControl({
  // defaultStatements มีหน้าตาประมาณนี้
  // {
  //   user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  //   session: ['list', 'revoke', 'delete'],
  // }
  ...defaultStatements,
  course: ['create', 'read', 'update', 'delete', 'import'],
  employee: ['create', 'read', 'update', 'import'],
  tag: ['create', 'read', 'update', 'delete'],
  report: ['create', 'read', 'update', 'delete'],
  orgUnit: ['create', 'read', 'update', 'delete'],
});

const adminRole = ac.newRole({
  // adminAc.statements — ใช้ใน ac.newRole()
  // คือ "permission ที่ admin role ได้รับ" (full access ทุก action ใน defaultStatements)
  ...adminAc.statements,
  course: ['create', 'read', 'update', 'delete', 'import'],
  employee: ['create', 'read', 'update', 'import'],
  tag: ['create', 'read', 'update', 'delete'],
  report: ['create', 'read', 'update', 'delete'],
  orgUnit: ['create', 'read', 'update', 'delete'],
});

const managerRole = ac.newRole({
  course: ['create', 'read', 'update', 'import'],
  employee: ['create', 'read', 'update', 'import'],
  tag: ['create', 'read', 'update'],
  report: ['create', 'read', 'update'],
  orgUnit: ['create', 'read', 'update'],
});

const employeeRole = ac.newRole({
  course: ['read'],
  employee: ['read'],
  tag: ['read'],
  report: ['read'],
  orgUnit: ['read'],
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  // ถ้า User model มี custom field เพิ่ม
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'Employee',
        input: false, // ไม่ให้ client ส่งมาเอง
      },
      employee_id: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: env.ALLOWED_ORIGINS,
  plugins: [
    admin({
      ac,
      defaultRole: 'Employee',
      adminRoles: ['Admin', 'Manager'],
      roles: {
        Admin: adminRole,
        Manager: managerRole,
        Employee: employeeRole,
      },
    }) as any,
  ],
});

export type Auth = typeof auth;
