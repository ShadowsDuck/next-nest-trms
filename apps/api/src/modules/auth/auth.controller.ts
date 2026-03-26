import { User } from '@workspace/database';
import type { Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import jwtConfig from './config/jwt.config';
import refreshConfig from './config/refresh-token.config';
import webUrlConfig from './config/web-url.config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { GoogleAuthGuard } from './guards/google-oauth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtTokenConfig: ConfigType<typeof jwtConfig>,
    @Inject(refreshConfig.KEY)
    private readonly refreshTokenConfig: ConfigType<typeof refreshConfig>,
    @Inject(webUrlConfig.KEY)
    private readonly webConfig: ConfigType<typeof webUrlConfig>,
  ) {}

  // Register new user
  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'สร้างบัญชีผู้ใช้ใหม่' })
  @ZodResponse({
    status: 201,
    type: UserResponseDto,
    description: 'สร้างบัญชีผู้ใช้สำเร็จ',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const result = await this.authService.register(registerDto);

    this.setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return result.user;
  }

  // Login user
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'เข้าสู่ระบบ' })
  @ApiBody({ type: LoginDto })
  @ZodResponse({
    status: 200,
    type: UserResponseDto,
    description: 'เข้าสู่ระบบสำเร็จ',
  })
  async login(
    @GetUser() user: Omit<User, 'password'>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const result = await this.authService.login(user);

    this.setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return result.user;
  }

  // Google Login
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  @ApiOperation({ summary: 'เข้าสู่ระบบด้วยบัญชี Google' })
  async googleAuth() {}

  // Google Callback
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'รับการตอบกลับจาก Google' })
  async googleCallback(
    @GetUser() user: Omit<User, 'password'>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(user);

    this.setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.redirect(this.webConfig.webURL);
  }

  // Logout user and invalidate refresh token
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ออกจากระบบ' })
  async logout(
    @GetUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  // Refresh access token
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'รีเฟรช access token' })
  async refresh(
    @GetUser() user: Omit<User, 'password' | 'refresh_token'>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(
      user.id,
      user.email,
      user.role,
    );

    this.setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  // Set cookies
  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    // ตั้งค่า Cookie สำหรับ Access Token
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: Number(this.jwtTokenConfig.signOptions.expiresIn) * 1000,
    });

    // ตั้งค่า Cookie สำหรับ Refresh Token
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: Number(this.refreshTokenConfig.expiresIn) * 1000,
    });
  }
}
