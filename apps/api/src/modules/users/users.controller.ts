import {
  Session,
  UserHasPermission,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UserHasPermission({ permission: { user: ['list'] } })
  @Get('me')
  getProfile(@Session() session: UserSession) {
    return session.user;
  }
}
