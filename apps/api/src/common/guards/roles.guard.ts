import { UserRole } from '@workspace/database';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // ดึงข้อมูล Role ที่ต้องการจาก Decorator
    const requireRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ถ้าไม่มีการแปะ @Roles ไว้ แสดงว่าเป็น Public สำหรับทุกคนที่ Login แล้ว
    if (!requireRoles) {
      return true;
    }

    // ดึง User ออกมาจาก Request (ซึ่งถูกแปะมาโดย JwtAuthGuard)
    const user = context.switchToHttp().getRequest().user;

    // ตรวจสอบว่า User มี Role ที่ต้องการหรือไม่
    const hasRole = requireRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `การเข้าถึงถูกปฏิเสธ พื้นที่นี้สำหรับผู้ที่มีเป็น ${requireRoles.join(' หรือ ')} เท่านั้น`,
      );
    }

    return hasRole;
  }
}
