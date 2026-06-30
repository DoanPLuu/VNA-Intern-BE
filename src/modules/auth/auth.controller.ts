import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CreateCompany } from '../company/dto/company.dto';
import { AuthService } from './auth.service';
import {
  AdminSubmitNewEmailDTO,
  AdminVerifyChangeEmailOtpDTO,
  ChangePasswordDTO,
  ConfirmNewEmailDTO,
  ConfirmRegisterCompanyDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from './dto/auth.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { AccountType } from './entities/account.entity';
import { JwtPayload } from 'src/common/guards/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    return await this.authService.login(loginDTO);
  }
  @Post('registerDemo')
  async registerDemo() {
    return await this.authService.registerDemo(
      'admin',
      'Admin@123',
      AccountType.SO,
    );
  }
  @Post('register')
  async register(@Body() registerDto: RegisterDTO) {
    const username = registerDto.username;
    const password = registerDto.password;
    return await this.authService.registerUser(username, password);
  }
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDTO) {
    return await this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDTO) {
    return await this.authService.resetPassword(dto);
  }
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDTO,
  ) {
    return await this.authService.changePassword(req.user.sub, dto);
  }

  @Post('change-email/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi email bước 1 - gửi OTP qua email cũ' })
  async requestChangeEmail(@Req() req: AuthenticatedRequest) {
    return this.authService.requestChangeEmail(req.user.sub);
  }

  @Post('change-email/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi email bước 2 - xác thực otp + lưu email mới' })
  async confirmChangeEmail(
    @Req() req: AuthenticatedRequest,
    @Body() body: ConfirmNewEmailDTO,
  ) {
    return this.authService.confirmChangeEmail(
      req.user.sub,
      body.otp,
      body.email,
    );
  }
  //user-manager
  @Post('admin/user/:accountId/change-email/request-otp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin bước 1 - gửi OTP đổi email cho người dùng' })
  async requestChangeEmailOtpByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    return this.authService.requestChangeEmailOtpByAdmin(
      req.user.sub,
      accountId,
    );
  }

  @Post('admin/user/:accountId/change-email/verify-otp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_USER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin bước 2 - xác thực OTP đổi email cho người dùng',
  })
  async verifyChangeEmailOtpByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: AdminVerifyChangeEmailOtpDTO,
  ) {
    return this.authService.verifyChangeEmailOtpByAdmin(
      req.user.sub,
      accountId,
      dto.otp,
    );
  }

  @Post('admin/user/:accountId/change-email/submit-new-email')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_USER')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Admin bước 3 - nhập email mới cho người dùng sau khi OTP đã xác thực',
  })
  async submitNewEmailByAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: AdminSubmitNewEmailDTO,
  ) {
    return this.authService.submitNewEmailByAdmin(
      req.user.sub,
      accountId,
      dto.sessionId,
      dto.newEmail,
    );
  }

  @Post('register-company')
  @ApiOperation({ summary: 'Bước 1: DN tự đăng ký, gửi OTP xác nhận email' })
  async registerCompany(@Body() dto: CreateCompany) {
    return await this.authService.registerCompany(dto);
  }

  @Post('register-company/confirm')
  @ApiOperation({ summary: 'Bước 2: Xác nhận OTP, kích hoạt tài khoản DN' })
  async confirmRegisterCompany(@Body() dto: ConfirmRegisterCompanyDTO) {
    return this.authService.confirmRegisterCompany(dto.email, dto.otp);
  }
}
