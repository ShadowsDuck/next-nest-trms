import { createFactory } from 'hono/factory';

// กำหนด type ของ Context Variables ไว้ที่เดียวเพื่อแชร์ระหว่าง middleware และ router ทุกตัว
export type AppEnv = {
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

// สร้าง factory instance สำหรับใช้สร้าง app, middleware และ handler ทั่วทั้งโปรเจกต์
export const factory = createFactory<AppEnv>();
