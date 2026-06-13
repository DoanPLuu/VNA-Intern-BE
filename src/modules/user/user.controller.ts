import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfileDto } from './dto/userProfile.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { AccountType } from '../auth/entities/account.entity';

interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
}
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('update_userprofile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateUserProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserProfileDto: UserProfileDto,
  ) {
    const result = await this.userService.updateUserProfile(
      req.user.sub,
      updateUserProfileDto,
    );
    if (!result) {
      return {
        message:
          'Email đã được cập nhật trước đó, vui lòng sử dụng chức năng thay đổi email để đổi email mới',
      };
    }
    return result;
  }
  @Get('profile/:username')
  async getUserProfileDetail(@Param('username') username: string) {
    return this.userService.getUserProfile(username);
  }
}
