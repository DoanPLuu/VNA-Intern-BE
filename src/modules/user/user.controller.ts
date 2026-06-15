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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';

import type { Response as ExpressResponse, Request } from 'express';
import type { StorageEngine } from 'multer';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { AccountType } from '../auth/entities/account.entity';
import { CreateUserDto } from './dto/CreateUser.dto';
import { DeleteUsersDto } from './dto/DeleteUser.dto';
import { ListUserDto } from './dto/listUser.dto';
import { ResetUserPasswordDto } from './dto/ResetUserPasswordDto';
import { ToggleUserActiveDto } from './dto/ToggleUserActive.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserProfileDto } from './dto/userProfile.dto';
import { UserService } from './user.service';
interface JwtPayload {
  sub: number;
  username: string;
  accountType: AccountType;
  roleCode?: string | null;
  permissions?: string[];
}
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
interface UploadedExcelFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}
const excelFileFilter = (
  _req: Request,
  file: UploadedExcelFile,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  const fileExt = extname(file.originalname).toLowerCase();

  if (
    !allowedMimeTypes.includes(file.mimetype) &&
    !['.xlsx', '.xls'].includes(fileExt)
  ) {
    return cb(
      new BadRequestException('File import phải có định dạng .xlsx hoặc .xls'),
      false,
    );
  }

  cb(null, true);
};

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('VIEW_USER')
  @ApiBearerAuth()
  async listUsers(@Query() query: ListUserDto) {
    return this.userService.getAllUsers(query);
  }

  @Patch('delete')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE_USER')
  @ApiBearerAuth()
  async deleteUserByAdmin(@Body() dto: DeleteUsersDto) {
    return this.userService.deleteUser(dto);
  }

  @Patch('restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE_USER')
  @ApiBearerAuth()
  async restoreUsers(@Body() dto: DeleteUsersDto) {
    return this.userService.restoreUsers(dto);
  }
  @Get('delete')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE_USER')
  @ApiBearerAuth()
  async listDeletedUsers(@Query() query: ListUserDto) {
    return this.userService.getDeletedUsers(query);
  }

  @Get('import/template')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE_USER')
  @ApiBearerAuth()
  async downloadImportTemplate(@Res() res: ExpressResponse) {
    const buffer = await this.userService.generateImportTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="mau-import-nguoi-dung.xlsx"',
    );

    res.send(buffer);
  }

  @Post('import/preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE_USER')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: excelFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async previewImportUsers(@UploadedFile() file?: UploadedExcelFile) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel để kiểm tra');
    }

    return this.userService.previewImportUsers(file.buffer);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE_USER')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: excelFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async importUsers(@UploadedFile() file?: UploadedExcelFile) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel để import');
    }

    return this.userService.importUsers(file.buffer);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('VIEW_USER')
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_USER')
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE_USER')
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
  @Patch(':accountId/reset-password')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_USER')
  @ApiBearerAuth()
  async resetUserPasswordByAdmin(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.userService.resetUserPasswordByAdmin(accountId, dto);
  }
  @Patch(':accountId/active')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE_USER')
  @ApiBearerAuth()
  async toggleUserActive(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: ToggleUserActiveDto,
  ) {
    return this.userService.toggleUserActive(accountId, dto);
  }
}
