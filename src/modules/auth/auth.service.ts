import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../user/entities/refresh-token.entity';
import { Account } from './entities/account.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async findAccountByUserName(username: string): Promise<Account | null> {
    return await this.accountRepo.findOne({ where: { username } });
  }

  async validateUser(username: string, password: string): Promise<Account> {
    const account = await this.findAccountByUserName(username);
    if (!account || !(await bcrypt.compare(password, account.password))) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }
    if (!account.isActive) {
      throw new UnauthorizedException('Tài khoản này đã bị khóa');
    }
    return account;
  }

  async registerUser(username: string, password: string) {
    const account = await this.findAccountByUserName(username);
    if (account) return null;
    return await this.userService.createUserAccount(username, password);
  }

  async login(dto: LoginDTO) {
    const { username, password, rememberMe } = dto;
    const account = await this.validateUser(username, password);
    const tokens = await this.generateTokens(account, rememberMe ?? false);
    return {
      message: 'Đăng nhập thành công',
      ...tokens,
    };
  }

  async registerDemo(username: string, password: string, role: string) {
    const account = this.accountRepo.create({
      username,
      password: await bcrypt.hash(password, 10),
      role,
    });
    return await this.accountRepo.save(account);
  }

  getOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private signToken(
    payload: Record<string, unknown>,
    secret: string,
    expiresInMs: number,
  ): string {
    const jwtSvc = this.jwtService as unknown as {
      sign: (p: Record<string, unknown>, o: object) => string;
    };
    return jwtSvc.sign(payload, {
      secret,
      expiresIn: Math.floor(expiresInMs / 1000),
    });
  }

  private async generateTokens(
    account: Account, // ← đổi từ User sang Account
    rememberMe: boolean,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Record<string, unknown> = {
      sub: account.id, // number (account_id)
      username: account.username,
      role: account.role,
    };

    // ── Access Token ──────────────────────────────────────────
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const accessMs = this.parseExpiryMs(
      this.config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '1h'),
    );
    const accessToken = this.signToken(payload, accessSecret, accessMs);

    // ── Refresh Token ─────────────────────────────────────────
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const refreshExpiryStr = rememberMe
      ? this.config.get<string>('JWT_REFRESH_REMEMBER_TOKEN_EXPIRES_IN', '30d')
      : this.config.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d');
    const refreshMs = this.parseExpiryMs(refreshExpiryStr);
    const refreshToken = this.signToken(payload, refreshSecret, refreshMs);

    // ── Lưu hash refresh token vào DB ─────────────────────────
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + refreshMs);

    await this.refreshTokenRepo.save({
      accountId: account.id, // ← dùng accountId thay vì userId
      tokenHash,
      isRememberMe: rememberMe,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private parseExpiryMs(expiry: string | undefined): number {
    const str = expiry ?? '7d';
    const num = parseInt(str, 10);
    const unit = str.slice(-1);
    return unit === 'd'
      ? num * 86_400_000
      : unit === 'h'
        ? num * 3_600_000
        : num * 60_000;
  }
}
