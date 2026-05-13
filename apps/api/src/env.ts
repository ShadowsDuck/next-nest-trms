import { z } from 'zod';

/**
 * Schema สำหรับตรวจสอบ Environment Variables ของ API
 */
const envSchema = z.object({
  // Server configuration
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Security & Auth
  ALLOWED_ORIGINS: z.string().transform((str) => str.split(',')),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // Social Auth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // OneDrive (Course Attachments)
  ONEDRIVE_CLIENT_ID: z.string().optional(),
  ONEDRIVE_CLIENT_SECRET: z.string().optional(),
  ONEDRIVE_REFRESH_TOKEN: z.string().optional(),
  ONEDRIVE_FOLDER_ID: z.string().optional(),
  ONEDRIVE_SCOPE: z.string().default('offline_access Files.ReadWrite'),
  ONEDRIVE_TOKEN_ENDPOINT: z
    .string()
    .default('https://login.microsoftonline.com/consumers/oauth2/v2.0/token'),
});

// ตรวจสอบความถูกต้องของ environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
