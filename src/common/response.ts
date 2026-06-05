import {
  AppBadRequestError,
  AppConflictError,
  AppForbiddenError,
  AppInternalServerError,
  AppNotAcceptableError,
  AppNotFoundError,
  AppUnauthorizedError,
} from './error';

export class Response {
  static success(data?: unknown, message = 'Success') {
    return {
      success: true,
      message,
      data,
    };
  }

  static created(data?: unknown, message = 'Created successfully') {
    return {
      success: true,
      message,
      data,
    };
  }

  static updated(data?: unknown, message = 'Updated successfully') {
    return {
      success: true,
      message,
      data,
    };
  }

  static deleted(message = 'Deleted successfully') {
    return {
      success: true,
      message,
    };
  }

  static errorBad(message = 'Bad request', errors?: unknown, detail?: unknown) {
    return new AppBadRequestError(message, errors, detail);
  }

  static errorDuplicated(
    message = 'Field duplicated',
    errors?: unknown,
    detail?: unknown,
  ) {
    return new AppConflictError(message, errors, detail);
  }

  static errorForbidden(
    message = 'Forbidden',
    errors?: unknown,
    detail?: unknown,
  ) {
    return new AppForbiddenError(message, errors, detail);
  }

  static errorUnauthorized(
    message = 'Unauthorized',
    errors?: unknown,
    detail?: unknown,
  ) {
    return new AppUnauthorizedError(message, errors, detail);
  }

  static errorNotFound(
    message = 'Not found',
    errors?: unknown,
    detail?: unknown,
  ) {
    return new AppNotFoundError(message, errors, detail);
  }

  static errorNotAcceptable(
    message = 'Not acceptable',
    errors?: unknown,
    detail?: unknown,
  ) {
    return new AppNotAcceptableError(message, errors, detail);
  }

  static errorInternal(
    message = 'Internal server error',
    errors?: unknown,
    detail?: unknown,
  ) {
    return new AppInternalServerError(message, errors, detail);
  }
}

export default Response;
