// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Request } from 'express';
// import { Account } from 'src/modules/auth/entities/account.entity';
// import { Repository } from 'typeorm';

// interface JwtPayload {
//   sub: number;
//   username: string;
//   accountType: string;
//   roleCode?: string | null;
//   permissions?: string[];
//   tokenVersion?: number;
// }

// interface AuthenticatedRequest extends Request {
//   user: JwtPayload;
// }

// @Injectable()
// export class JwtAuthGuard implements CanActivate {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly config: ConfigService,
//     @InjectRepository(Account)
//     private readonly accountRepo: Repository<Account>,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
//     const authHeader: string | undefined = request.headers['authorization'];

//     if (!authHeader?.startsWith('Bearer ')) {
//       throw new UnauthorizedException('Vui lòng đăng nhập');
//     }

//     const token: string = authHeader.split(' ')[1];

//     try {
//       const payload = this.jwtService.verify<JwtPayload>(token, {
//         secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
//       });
//       const account = await this.accountRepo.findOne({
//         where: { id: payload.sub },
//         select: {
//           id: true,
//           isActive: true,
//           isDeleted: true,
//           tokenVersion: true,
//         },
//       });
//       if (!account || account.isDeleted) {
//         throw new UnauthorizedException('Tài khoản không tồn tại');
//       }

//       if (!account.isActive) {
//         throw new UnauthorizedException('Tài khoản đã bị khóa');
//       }

//       if (payload.tokenVersion !== account.tokenVersion) {
//         throw new UnauthorizedException('Phiên đăng nhập đã hết hiệu lực');
//       }
//       request.user = payload;
//       return true;
//     } catch (err) {
//       if (err instanceof TokenExpiredError) {
//         throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
//       }
//       if (err instanceof JsonWebTokenError) {
//         throw new UnauthorizedException('Token không hợp lệ');
//       }
//       throw new UnauthorizedException('Vui lòng đăng nhập');
//     }
//   }
// }
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
