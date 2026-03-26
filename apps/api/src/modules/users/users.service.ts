import { hash } from 'argon2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    const hashedPassword = await hash(password);

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        employee_id: true,
        email: true,
        role: true,
        refresh_token: true,
        google_id: true,
        picture: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  }

  async createGoogle(googleId: string, email: string, picture?: string | null) {
    const user = await this.prismaService.user.create({
      data: {
        google_id: googleId,
        email: email,
        picture: picture,
        password: null,
      },
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    return user;
  }

  async findOne(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    return user;
  }

  async updateHashedRefreshToken(userId: string, hashedRT: string | null) {
    return await this.prismaService.user.update({
      where: { id: userId },
      data: { refresh_token: hashedRT },
    });
  }

  async updateGoogleId(
    userId: string,
    data: { googleId: string; picture: string | null },
  ) {
    return await this.prismaService.user.update({
      where: { id: userId },
      data: {
        google_id: data.googleId,
        picture: data.picture,
      },
    });
  }
}
