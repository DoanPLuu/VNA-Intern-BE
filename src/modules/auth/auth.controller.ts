import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfirmNewEmailDTO, LoginDTO, RegisterDTO } from './dto/auth.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ResetPasswordDTO } from './dto/auth.dto';

import { AccountRole } from './entities/account.entity';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

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
      AccountRole.SO,
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
    console.log(req.user.sub);
    return this.authService.confirmChangeEmail(
      req.user.sub,
      body.otp,
      body.email,
    );
  }
}
