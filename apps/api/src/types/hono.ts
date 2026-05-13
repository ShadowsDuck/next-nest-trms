/**
 * กำหนด type ของ Context Variables และ Environment สำหรับ Hono Instance ทั่วทั้งโปรเจกต์
 */
export type HonoEnv = {
  Variables: {
    user: {
      id: string;
      name: string;
      email: string;
      role?: string | null;
      [key: string]: unknown;
    };
    session: {
      id: string;
      userId: string;
      [key: string]: unknown;
    };
  };
};
