import { prisma } from '@workspace/database';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

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
        defaultValue: 'EMPLOYEE',
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
});

export type Auth = typeof auth;
