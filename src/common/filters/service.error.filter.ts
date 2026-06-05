import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { QueryFailedError } from 'typeorm';
import { ServiceError } from '../error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();

    if (exception instanceof ServiceError) {
      return response.status(exception.status).json({
        success: false,
        code: exception.code,
        message: exception.message,
        errors: exception.errors ?? null,
        detail: exception.detail ?? null,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string | string[] = exception.message;
      let errors: unknown = null;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        message = responseObj.message ?? exception.message;
        errors = responseObj;
      }

      return response.status(status).json({
        success: false,
        code: this.mapHttpStatusToCode(status),
        message,
        errors,
        detail: null,
      });
    }

    if (exception instanceof QueryFailedError) {
      const driverError = exception as QueryFailedError & {
        code?: string;
        detail?: string;
      };

      if (driverError.code === '23505') {
        return response.status(HttpStatus.CONFLICT).json({
          success: false,
          code: 'CONFLICT',
          message: 'Dữ liệu đã tồn tại',
          errors: null,
          detail: driverError.detail ?? null,
        });
      }
    }

    this.logger.error(exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
      errors: null,
      detail: null,
    });
  }

  private mapHttpStatusToCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.NOT_ACCEPTABLE:
        return 'NOT_ACCEPTABLE';
      default:
        return 'HTTP_EXCEPTION';
    }
  }
}
