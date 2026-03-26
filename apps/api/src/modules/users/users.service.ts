import { UserRole } from '@workspace/database';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      include: { employee: true },
    });
  }

  async findOne(userId: string) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });
  }

  async assignEmployee(userId: string, employeeId: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { employee_id: employeeId },
    });
  }

  async updateRole(userId: string, role: UserRole) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
