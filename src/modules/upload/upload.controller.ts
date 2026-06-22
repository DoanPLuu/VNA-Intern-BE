import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';

@Controller('upload')
export class UploadController {
  // ── Upload file ──────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Upload file (PDF, word, ảnh)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        // Chỉ chấp nhận PDF, ảnh và word
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Chỉ chấp nhận file PDF, ảnh (jpg, png, webp) hoặc Word (doc, docx)',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    return {
      success: true,
      message: 'Upload file thành công',
      data: {
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`, // URL để FE dùng
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    };
  }

  // ── Xóa file ────────────────────────────────────────────────
  @Delete(':filename')
  @ApiOperation({ summary: 'Xóa file đã upload' })
  deleteFile(@Param('filename') filename: string) {
    const filePath = join(process.cwd(), 'uploads', filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('File không tồn tại');
    }

    unlinkSync(filePath);

    return {
      success: true,
      message: 'Xóa file thành công',
    };
  }
}
