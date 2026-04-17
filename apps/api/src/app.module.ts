import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { auth } from './auth/auth';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ZodValidationExceptionFilter } from './filters/zod-validation-exception.filter';
import { CoursesModule } from './modules/courses/courses.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { OrganizationUnitsModule } from './modules/organization-units/organization-units.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BetterAuthModule.forRoot({ auth }), // Global Guard (ทุก route protected by default)
    PrismaModule,
    CoursesModule,
    EmployeesModule,
    OrganizationUnitsModule,
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
  ],
})
export class AppModule {}
