import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      // อ่าน access_token จาก cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.access_token ?? null,
      ]),
      // ไม่ยอมรับ Token ที่หมดอายุแล้ว
      ignoreExpiration: false,
      // ใช้ Secret Key เดียวกับตอนสร้าง Token เพื่อตรวจสอบความถูกต้อง
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return await this.authService.validateJwtUser(payload.sub);
  }
}
