import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter<ZodValidationException> {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const zodError = exception.getZodError() as {
      issues: { path: (string | number)[]; message: string }[];
    };

    response.status(status).json({
      message: 'Validation failed',
      errors: zodError.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
      statusCode: status,
    });
  }
}
