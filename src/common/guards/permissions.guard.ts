import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AccountType } from 'src/modules/auth/entities/account.entity';
interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
  roleCode?: string | null;
  permissions?: string[];
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!requiredPermissions.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Bổ sung luồng xử lý cho DN
    const user = request.user;
    if (user?.accountType === AccountType.DOANH_NGHIEP) {
      return true;
    }
    const userPermissions = request.user?.permissions ?? [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện chức năng này',
      );
    }

    return true;
  }
}
