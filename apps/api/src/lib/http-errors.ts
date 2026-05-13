import { HTTPException } from 'hono/http-exception';

/**
 * โยนความผิดพลาดเมื่อไม่พบข้อมูล (404 Not Found)
 * @param message ข้อความแสดงความผิดพลาด
 */
export const throwNotFound = (message: string) => {
  throw new HTTPException(404, { message });
};

/**
 * โยนความผิดพลาดเมื่อข้อมูลขัดแย้งกัน (409 Conflict)
 * @param message ข้อความแสดงความผิดพลาด
 */
export const throwConflict = (message: string) => {
  throw new HTTPException(409, { message });
};

/**
 * โยนความผิดพลาดเมื่อคำขอไม่ถูกต้อง (400 Bad Request)
 * @param message ข้อความแสดงความผิดพลาด
 */
export const throwBadRequest = (message: string) => {
  throw new HTTPException(400, { message });
};

/**
 * โยนความผิดพลาดเมื่อไม่ได้เข้าสู่ระบบหรือไม่มีสิทธิ์ (401 Unauthorized)
 * @param message ข้อความแสดงความผิดพลาด
 */
export const throwUnauthorized = (message: string) => {
  throw new HTTPException(401, { message });
};
