import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfileDto } from './dto/userProfile.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('update_userprofile')
  async updateUserProfile(@Body() updateUserProfileDto: UserProfileDto) {
    return this.userService.updateUserProfile(updateUserProfileDto);
  }
  @Get('profile/:username')
  async getUserProfile(@Param('username') username: string) {
    return this.userService.getUserProfile(username);
  }
}
