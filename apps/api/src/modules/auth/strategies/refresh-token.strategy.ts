import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      // อ่าน refresh_token จาก cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.refresh_token ?? null,
      ]),
      // ไม่ยอมรับ Token ที่หมดอายุแล้ว
      ignoreExpiration: false,
      // ใช้ Secret Key เดียวกับตอนสร้าง Token เพื่อตรวจสอบความถูกต้อง
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      // ตั้งค่าให้ส่งค่า Request เข้าไปใน validate() เพื่อเอา Token มาเช็ค bcrypt
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: { sub: string }) {
    const userId = payload.sub;
    const refreshToken = request?.cookies?.refresh_token as string | null;

    return await this.authService.validateRefreshToken(userId, refreshToken);
  }
}
