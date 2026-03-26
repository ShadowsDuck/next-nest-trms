import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ZodValidationExceptionFilter } from './filters/zod-validation-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    EmployeesModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      // for zod validation
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      // for zod response data
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      // for http exception filter
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      // for zod validation exception filter
      provide: APP_FILTER,
      useClass: ZodValidationExceptionFilter,
    },
    {
      // @UseGuards(JwtAuthGuard) for all of the controllers
      // if you want to skip the guard, you can use the @Public()
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      // @UseGuards(RolesGuard) for all of the controllers
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
