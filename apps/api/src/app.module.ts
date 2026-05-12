import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { auth } from './auth/auth';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ZodValidationExceptionFilter } from './filters/zod-validation-exception.filter';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BetterAuthModule.forRoot({ auth }), // Global Guard (ทุก route protected by default)
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 300),
      },
    ]),
    PrismaModule,
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
      // for global rate limiting
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
