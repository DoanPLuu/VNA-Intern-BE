import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseInterface<T> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  ResponseInterface<T>,
  ResponseInterface<unknown>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<ResponseInterface<T>>,
  ): Observable<ResponseInterface<unknown>> {
    return next.handle().pipe(
      map((item): ResponseInterface<unknown> => {
        if (!item || typeof item !== 'object' || !('data' in item)) {
          return item;
        }

        return {
          ...item,
          data: item.data == null ? item.data : instanceToPlain(item.data),
        };
      }),
    );
  }
}
