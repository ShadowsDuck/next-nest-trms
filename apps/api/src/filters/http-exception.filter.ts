import { Response } from 'express';
import { ZodSerializationException } from 'nestjs-zod';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError() as {
        issues: unknown[];
      };
      this.logger.error(
        `Serialization failed: ${exception.message}`,
        zodError.issues,
      );

      response.status(500).json({
        message: 'Internal server error: response serialization failed',
        statusCode: 500,
      });
      return;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
