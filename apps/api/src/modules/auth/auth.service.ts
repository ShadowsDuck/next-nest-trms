import { User } from '@workspace/database';
import { hash, verify } from 'argon2';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import refreshConfig from './config/refresh-token.config';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(refreshConfig.KEY)
    private readonly refreshTokenConfig: ConfigType<typeof refreshConfig>,
  ) {}

  // Register user
  async register(registerDto: RegisterDto): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('อีเมลนี้ถูกใช้ไปแล้ว');
    }

    const newUser = await this.usersService.create(registerDto);

    const tokens = await this.generateTokens(
      newUser.id,
      newUser.email,
      newUser.role,
    );

    const hashedRT = await hash(tokens.refreshToken);
    await this.usersService.updateHashedRefreshToken(newUser.id, hashedRT);

    return {
      ...tokens,
      user: this.formatUser(newUser),
    };
  }

  // Login
  async login(user: Omit<User, 'password'>): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    const hashedRT = await hash(tokens.refreshToken);
    await this.usersService.updateHashedRefreshToken(user.id, hashedRT);

    return {
      ...tokens,
      user: this.formatUser(user),
    };
  }

  // Logout
  async logout(userId: string): Promise<void> {
    await this.usersService.updateHashedRefreshToken(userId, null);
  }

  // Validate local jwt user
  async validateLocalUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('ไม่พบข้อมูลผู้ใช้');
    }

    const isPasswordMatched = await verify(user.password, password);
    if (!isPasswordMatched)
      throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');

    const { password: _, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  // Validate JWT user
  async validateJwtUser(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('ไม่พบข้อมูลผู้ใช้');
    }

    const { password: _, refresh_token: __, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  // Validate refresh token
  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException(
        'ไม่พบสิทธิ์การเข้าถึง (Invalid Refresh Token)',
      );
    }

    const refreshTokenMatched = await verify(user.refresh_token, refreshToken);
    if (!refreshTokenMatched) {
      throw new UnauthorizedException('ไม่พบสิทธิ์การเข้าถึง (Token Mismatch)');
    }

    const { password: _, refresh_token: __, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  // Validate google user
  async validateGoogleUser(
    googleId: string,
    email: string,
    picture?: string | null,
  ) {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createGoogle(googleId, email, picture);
    } else {
      if (!user.google_id) {
        user = await this.usersService.updateGoogleId(user.id, {
          googleId,
          picture: picture || null,
        });
      }

      if (user.google_id !== googleId) {
        throw new UnauthorizedException('บัญชี Google ไม่ตรงกับในระบบ');
      }
    }

    const { password: _, refresh_token: __, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  // Generate access and refresh tokens
  async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // เตรียมข้อมูล (Payload) และสร้างไอดีสุ่มสำหรับ Refresh Token
    const payload = { sub: userId, email: email, role: role };

    // สร้างทั้ง Access และ Refresh Token พร้อมกัน
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);

    return { accessToken, refreshToken };
  }

  // Refresh access token
  async refreshTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      email,
      role,
    );

    const hashedRT = await hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(userId, hashedRT);

    return { accessToken, refreshToken };
  }

  // Format user response
  private formatUser(user: Omit<User, 'password'>): UserResponseDto {
    return {
      ...user,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }
}
