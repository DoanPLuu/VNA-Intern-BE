import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO } from './dto/auth.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ResetPasswordDTO } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    return await this.authService.login(loginDTO);
  }
  @Post('registerDemo')
  async registerDemo() {
    return await this.authService.registerDemo('admin', 'Admin@123', 'So');
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
}
