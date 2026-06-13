import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'src/common';
import { MailService } from 'src/common/mail/mail.service';
import { Repository } from 'typeorm';
import { EmailChangeSession } from '../user/entities/email-change-session.entity';
import { OtpCode, OtpType } from '../user/entities/otp-code.entity';
import { RefreshToken } from '../user/entities/refresh-token.entity';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ChangePasswordDTO, LoginDTO, ResetPasswordDTO } from './dto/auth.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { Account, AccountType } from './entities/account.entity';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OtpCode)
    private readonly otpCodeRepo: Repository<OtpCode>,
    @InjectRepository(EmailChangeSession)
    private readonly emailChangeSessionRepo: Repository<EmailChangeSession>,

    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
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
    if (!account.isActive || account.isDeleted)
      return {
        message:
          'Tài khoản đã bị xóa hoặc đã bị khóa. Vui lòng liên hệ admin để biết thêm thông tin',
      };
    const tokens = await this.generateTokens(account, rememberMe ?? false);
    return {
      message: 'Đăng nhập thành công',
      ...tokens,
    };
  }

  // Tạo tài khoản cho role Sở với Profile rỗng
  async registerDemo(
    username: string,
    password: string,
    accountType: AccountType,
  ) {
    const existingAccount = await this.findAccountByUserName(username);
    if (existingAccount) return { message: 'Tài khoản đã tồn tại' };
    // Tạo account
    return this.userService.createUserAccount(username, password, accountType);
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
    account: Account,
    rememberMe: boolean,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Record<string, unknown> = {
      sub: account.id,
      username: account.username,
      accountType: account.accountType,
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
      accountId: account.id,
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

  async forgotPassword(dto: ForgotPasswordDTO) {
    const account = await this.accountRepo.findOne({
      where: { email: dto.email },
    });
    if (!account) {
      throw Response.errorNotFound('Không tìm thấy người dùng với email này');
    }
    const user = await this.userRepo.findOne({
      where: { accountId: account.id },
    });
    const displayName = user?.fullName ?? account.username;
    const otp = this.getOTPCode();
    const otpExpiresMinutes = this.config.get<number>('OTP_EXPIRES_MINUTES', 5);
    const expiresAt = new Date(Date.now() + otpExpiresMinutes * 60 * 1000);

    await this.otpCodeRepo.save({
      accountId: account.id,
      email: account.email ?? undefined,
      code: otp,
      type: OtpType.FORGOT_PASSWORD,
      isUsed: false,
      expiresAt,
    });
    await this.mailService.sendForgotPasswordEmail(
      dto.email,
      displayName,
      account.username,
      otp,
      otpExpiresMinutes,
    );
    return Response.success({ email: account.email }, 'gửi email thành công');
  }

  async resetPassword(dto: ResetPasswordDTO) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw Response.errorBad('xác nhận mật khẩu không khớp');
    }
    const account = await this.accountRepo.findOne({
      where: { email: dto.email },
    });
    if (!account) {
      throw Response.errorNotFound('email chưa đăng ký trên hệ thống');
    }
    const otpRecord = await this.otpCodeRepo.findOne({
      where: {
        accountId: account.id,
        code: dto.otp,
        type: OtpType.FORGOT_PASSWORD,
        isUsed: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
    if (!otpRecord) {
      throw Response.errorBad('Mã OTP không đúng');
    }
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw Response.errorBad('Mã OTP đã hết hạn');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    account.password = passwordHash;
    await this.accountRepo.save(account);
    otpRecord.isUsed = true;
    await this.otpCodeRepo.save(otpRecord);
    return Response.success(null, 'khôi phục mật khẩu thành công');
  }
  async changePassword(accountId: number, dto: ChangePasswordDTO) {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account) return Response.errorNotFound('Tài khoản không tồn tại');

    const isMatch = await bcrypt.compare(dto.password, account.password);
    if (!isMatch) return Response.errorBad('Mật khẩu hiện tại không khớp');

    if (dto.newPassword !== dto.confirmPassword)
      return Response.errorBad('Xác nhận mật khẩu không khớp');

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    account.password = newPasswordHash;
    await this.accountRepo.save(account);
    return Response.success(null, 'Đổi mật khẩu thành công');
  }
  async requestChangeEmail(accountId: number) {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });
    if (!account?.email) {
      return Response.errorBad('Tai khoan chua co email de xac thuc');
    }
    await this.otpCodeRepo.update(
      { accountId, type: OtpType.CHANGE_EMAIL, isUsed: false },
      { isUsed: true },
    );

    const otpCode = this.getOTPCode();
    const expiresMinutes = this.config.get<number>('OTP_EXPIRES_MINUTES', 1);
    await this.otpCodeRepo.save(
      this.otpCodeRepo.create({
        accountId,
        code: otpCode,
        type: OtpType.CHANGE_EMAIL,
        expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
      }),
    );
    const user = await this.userRepo.findOne({ where: { accountId } });
    const displayName = user?.fullName ?? account.username;
    await this.mailService.sendChangeEmailOtp(
      account.email,
      displayName,
      otpCode,
    );
    return Response.success(null, 'Đã gửi mã OTP đến email hiện tại');
  }

  async confirmChangeEmail(accountId: number, otp: string, newEmail: string) {
    const otpRecord = await this.otpCodeRepo.findOne({
      where: {
        accountId,
        code: otp,
        type: OtpType.CHANGE_EMAIL,
        isUsed: false,
      },
    });
    if (!otpRecord) return Response.errorBad('Mã OTP không hợp lệ');
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      return Response.errorBad('Mã OTP hết hạn');
    }
    const emailExists = await this.accountRepo.findOne({
      where: { email: newEmail },
    });
    if (emailExists && emailExists.id != accountId)
      return Response.errorBad('Email này đã được đăng ký bởi tài khoản khác');
    otpRecord.isUsed = true;
    await this.otpCodeRepo.save(otpRecord);
    await this.accountRepo.update({ id: accountId }, { email: newEmail });
    return Response.success(null, 'Thay đổi email thành công');
  }

  //user-manager
  async requestChangeEmailOtpByAdmin(
    adminAccountId: number,
    targetAccountId: number,
  ) {
    const targetAccount = await this.accountRepo.findOne({
      where: { id: targetAccountId },
    });

    if (!targetAccount) {
      throw Response.errorNotFound('Không tìm thấy tài khoản người dùng');
    }

    if (!targetAccount.email) {
      throw Response.errorBad(
        'Tài khoản này chưa có email hiện tại để xác thực',
      );
    }

    await this.otpCodeRepo.update(
      {
        accountId: targetAccountId,
        type: OtpType.CHANGE_EMAIL,
        isUsed: false,
      },
      { isUsed: true },
    );

    const otpCode = this.getOTPCode();
    const expiresMinutes = this.config.get<number>('OTP_EXPIRES_MINUTES', 5);

    await this.otpCodeRepo.save(
      this.otpCodeRepo.create({
        accountId: targetAccountId,
        code: otpCode,
        type: OtpType.CHANGE_EMAIL,
        isUsed: false,
        expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
      }),
    );

    const user = await this.userRepo.findOne({
      where: { accountId: targetAccountId },
    });
    const displayName = user?.fullName ?? targetAccount.username;

    await this.mailService.sendChangeEmailOtp(
      targetAccount.email,
      displayName,
      otpCode,
    );

    return Response.success(
      {
        accountId: targetAccountId,
        requestedBy: adminAccountId,
        currentEmail: targetAccount.email,
      },
      'Đã gửi mã OTP đến email hiện tại của người dùng',
    );
  }

  async verifyChangeEmailOtpByAdmin(
    adminAccountId: number,
    targetAccountId: number,
    otp: string,
  ) {
    const targetAccount = await this.accountRepo.findOne({
      where: { id: targetAccountId },
    });

    if (!targetAccount) {
      throw Response.errorNotFound('Không tìm thấy tài khoản người dùng');
    }

    const otpRecord = await this.otpCodeRepo.findOne({
      where: {
        accountId: targetAccountId,
        code: otp,
        type: OtpType.CHANGE_EMAIL,
        isUsed: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!otpRecord) {
      throw Response.errorBad('Mã OTP không hợp lệ');
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw Response.errorBad('Mã OTP đã hết hạn');
    }

    const sessionExpiresMinutes = this.config.get<number>(
      'CHANGE_EMAIL_SESSION_EXPIRES_MINUTES',
      10,
    );

    const session = await this.accountRepo.manager.transaction(
      async (manager) => {
        const otpRepo = manager.getRepository(OtpCode);
        const emailChangeSessionRepo =
          manager.getRepository(EmailChangeSession);

        await otpRepo.update({ id: otpRecord.id }, { isUsed: true });

        await emailChangeSessionRepo.update(
          {
            accountId: targetAccountId,
            verifiedByAccountId: adminAccountId,
            isUsed: false,
          },
          { isUsed: true },
        );

        return emailChangeSessionRepo.save(
          emailChangeSessionRepo.create({
            accountId: targetAccountId,
            verifiedByAccountId: adminAccountId,
            isUsed: false,
            expiresAt: new Date(Date.now() + sessionExpiresMinutes * 60 * 1000),
          }),
        );
      },
    );

    return Response.success(
      {
        sessionId: session.id,
        expiresAt: session.expiresAt,
      },
      'Xác thực OTP thành công',
    );
  }

  async submitNewEmailByAdmin(
    adminAccountId: number,
    targetAccountId: number,
    sessionId: string,
    newEmail: string,
  ) {
    const targetAccount = await this.accountRepo.findOne({
      where: { id: targetAccountId },
    });

    if (!targetAccount) {
      throw Response.errorNotFound('Không tìm thấy tài khoản người dùng');
    }

    const session = await this.emailChangeSessionRepo.findOne({
      where: {
        id: sessionId,
        accountId: targetAccountId,
        verifiedByAccountId: adminAccountId,
        isUsed: false,
      },
    });

    if (!session) {
      throw Response.errorBad('Phiên đổi email không hợp lệ');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw Response.errorBad('Phiên đổi email đã hết hạn');
    }

    const normalizedNewEmail = newEmail.trim().toLowerCase();

    if (targetAccount.email?.toLowerCase() === normalizedNewEmail) {
      throw Response.errorBad('Email mới không được trùng với email hiện tại');
    }

    const existedEmail = await this.accountRepo.findOne({
      where: { email: normalizedNewEmail },
    });

    if (existedEmail && existedEmail.id !== targetAccountId) {
      throw Response.errorDuplicated(
        'Email này đã được đăng ký bởi tài khoản khác',
      );
    }

    await this.accountRepo.manager.transaction(async (manager) => {
      const accountRepo = manager.getRepository(Account);
      const emailChangeSessionRepo = manager.getRepository(EmailChangeSession);

      await accountRepo.update(
        { id: targetAccountId },
        { email: normalizedNewEmail },
      );

      await emailChangeSessionRepo.update({ id: session.id }, { isUsed: true });
    });

    return Response.success(
      {
        accountId: targetAccountId,
        email: normalizedNewEmail,
      },
      'Thay đổi email thành công',
    );
  }
}
