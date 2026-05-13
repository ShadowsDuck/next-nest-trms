import { Context } from 'hono';
import { createFactory } from 'hono/factory';

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

export const factory = createFactory<HonoEnv>();

/**
 * Type helper สำหรับ handler ที่มี query validator
 */
export type QueryContext<T> = Context<
  HonoEnv,
  string,
  {
    out: {
      query: T;
    };
  }
>;

/**
 * Type helper สำหรับ handler ที่มี json validator
 */
export type JsonContext<T> = Context<
  HonoEnv,
  string,
  {
    out: {
      json: T;
    };
  }
>;

/**
 * Type helper สำหรับ handler ที่มีทั้ง json + param
 */
export type JsonWithParamContext<
  T,
  P extends Record<string, string> = { id: string },
> = Context<
  HonoEnv,
  string,
  {
    out: {
      json: T;
    };
    param: P;
  }
>;
