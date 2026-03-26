import { ExecutionContext, createParamDecorator } from '@nestjs/common';

// Custom Decorator สำหรับดึงข้อมูลผู้ใช้ (User) ออกจาก Request Object โดยตรง
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // ดึงข้อมูล Request ออกมาจาก Context
    const request = ctx.switchToHttp().getRequest();

    // ดึงข้อมูล user ที่ถูก JwtAuthGuard แปะไว้ให้
    const user = request.user;

    // ถ้ามีการระบุชื่อฟิลด์ (เช่น @GetUser('id')) ให้คืนค่าแค่ฟิลด์นั้น
    // ถ้าไม่ได้ระบุ (ใส่แค่ @GetUser()) ให้คืนค่า user กลับไปทั้งก้อน
    return data ? user?.[data] : user;
  },
);
