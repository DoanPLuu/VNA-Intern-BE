import { HttpStatus } from '@nestjs/common';

export class ServiceError extends Error {
  readonly success = false;
  readonly status: number;
  readonly code: string;
  readonly errors?: unknown;
  readonly detail?: unknown;

  constructor(
    code: string,
    status: number,
    message: string,
    errors?: unknown,
    detail?: unknown,
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.detail = detail;

    Error.captureStackTrace?.(this, new.target);
  }
}

export class AppBadRequestError extends ServiceError {
  constructor(message = 'Bad request', errors?: unknown, detail?: unknown) {
    super('BAD_REQUEST', HttpStatus.BAD_REQUEST, message, errors, detail);
  }
}

export class AppConflictError extends ServiceError {
  constructor(message = 'Conflict', errors?: unknown, detail?: unknown) {
    super('CONFLICT', HttpStatus.CONFLICT, message, errors, detail);
  }
}

export class AppForbiddenError extends ServiceError {
  constructor(message = 'Forbidden', errors?: unknown, detail?: unknown) {
    super('FORBIDDEN', HttpStatus.FORBIDDEN, message, errors, detail);
  }
}

export class AppUnauthorizedError extends ServiceError {
  constructor(message = 'Unauthorized', errors?: unknown, detail?: unknown) {
    super('UNAUTHORIZED', HttpStatus.UNAUTHORIZED, message, errors, detail);
  }
}

export class AppNotFoundError extends ServiceError {
  constructor(message = 'Not found', errors?: unknown, detail?: unknown) {
    super('NOT_FOUND', HttpStatus.NOT_FOUND, message, errors, detail);
  }
}

export class AppNotAcceptableError extends ServiceError {
  constructor(message = 'Not acceptable', errors?: unknown, detail?: unknown) {
    super('NOT_ACCEPTABLE', HttpStatus.NOT_ACCEPTABLE, message, errors, detail);
  }
}

export class AppInternalServerError extends ServiceError {
  constructor(
    message = 'Internal server error',
    errors?: unknown,
    detail?: unknown,
  ) {
    super(
      'INTERNAL_SERVER_ERROR',
      HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      errors,
      detail,
    );
  }
}
