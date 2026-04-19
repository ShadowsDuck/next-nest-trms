import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter<ZodValidationException> {
  private readonly logger = new Logger(ZodValidationExceptionFilter.name);

  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const zodError = exception.getZodError() as {
      issues: { path: (string | number)[]; message: string }[];
    };

    this.logger.warn(
      `${request.method} ${request.url} -> ${status}: validation failed`,
    );

    response.status(status).json({
      message: 'Validation failed',
      errors: zodError.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
