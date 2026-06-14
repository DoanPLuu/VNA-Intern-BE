import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';

import type { StorageEngine } from 'multer';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
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

interface UploadedAvatarFile {
  filename: string;
  mimetype: string;
  originalname: string;
}

const avatarUploadDir = join(process.cwd(), 'uploads', 'avatars', 'users');

const ensureAvatarUploadDir = () => {
  if (!existsSync(avatarUploadDir)) {
    mkdirSync(avatarUploadDir, { recursive: true });
  }
};

const avatarStorage: StorageEngine = diskStorage({
  destination: (_req, _file, cb) => {
    ensureAvatarUploadDir();
    cb(null, avatarUploadDir);
  },
  filename: (_req, file, cb) => {
    const fileExt = extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `user-avatar-${uniqueSuffix}${fileExt}`);
  },
});

const avatarFileFilter = (
  _req: Request,
  file: UploadedAvatarFile,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new BadRequestException('Ảnh đại diện chỉ chấp nhận jpg, png hoặc webp'),
      false,
    );
  }

  cb(null, true);
};

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

  @Patch('delete')
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
  @Get('delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listDeletedUsers(@Query() query: ListUserDto) {
    return this.userService.getDeletedUsers(query);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }
  // @Patch(':accountId')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // async updateUserByAdmin(
  //   @Param('accountId', ParseIntPipe) accountId: number,
  //   @Body() dto: UpdateUserDto,
  // ) {
  //   return this.userService.updateUser(accountId, dto);
  // }
  @Patch(':accountId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      fileFilter: avatarFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async updateUserByAdmin(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file?: UploadedAvatarFile,
  ) {
    const avatarPath = file
      ? `uploads/avatars/users/${file.filename}`
      : undefined;

    return this.userService.updateUser(accountId, dto, avatarPath);
  }

  // @Post()
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // async createUser(@Body() dto: CreateUserDto) {
  //   return this.userService.createUser(dto);
  // }
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      fileFilter: avatarFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async createUser(
    @Body() dto: CreateUserDto,
    @UploadedFile() file?: UploadedAvatarFile,
  ) {
    const avatarPath = file
      ? `uploads/avatars/users/${file.filename}`
      : undefined;

    return this.userService.createUser(dto, avatarPath);
  }
}
