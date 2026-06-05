import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO } from './dto/auth.dto';
import { AccountRole } from './entities/account.entity';

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
}
