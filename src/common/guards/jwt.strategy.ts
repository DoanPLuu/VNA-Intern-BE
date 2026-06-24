import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from 'src/modules/auth/entities/account.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const account = await this.accountRepo.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    // Tài khoản bị khóa
    if (account.isActive == false) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Token đã bị vô hiệu hóa
    if (payload.tokenVersion !== account.tokenVersion) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hiệu lực');
    }

    return {
      id: account.id,
      email: account.email,
      role: account.role,
      accountType: account.accountType,
    };
  }
}
