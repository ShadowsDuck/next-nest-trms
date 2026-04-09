import { prisma } from '@workspace/database';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

const ac = createAccessControl({
  // defaultStatements มีหน้าตาประมาณนี้
  // {
  //   user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  //   session: ['list', 'revoke', 'delete'],
  // }
  ...defaultStatements,
  employee: ['create', 'read', 'update'],
});

const adminRole = ac.newRole({
  // adminAc.statements — ใช้ใน ac.newRole()
  // คือ "permission ที่ admin role ได้รับ" (full access ทุก action ใน defaultStatements)
  ...adminAc.statements,
  employee: ['create', 'read', 'update'],
});

const managerRole = ac.newRole({
  employee: ['read'],
});

const employeeRole = ac.newRole({
  user: ['list'],
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
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(','),
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
