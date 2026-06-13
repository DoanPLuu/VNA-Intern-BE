import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { CreateUserDto } from './dto/CreateUser.dto';
import { DeleteUsersDto } from './dto/DeleteUser.dto';
import { ListUserDto } from './dto/listUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserProfileDto } from './dto/userProfile.dto';
import { UserService } from './user.service';
interface JwtPayload {
  sub: number;
  username: string;
  role: string;
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
  // Admin routes
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listUsers(@Query() query: ListUserDto) {
    return this.userService.getAllUsers(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Patch(':accountId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateUserByAdmin(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(accountId, dto);
  }
  @Patch(':accountId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteUserByAdmin(@Body() dto: DeleteUsersDto) {
    return this.userService.deleteUser(dto);
  }

  @Patch('restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async restoreUsers(@Body() dto: DeleteUsersDto) {
    return this.userService.restoreUsers(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }
}
