import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateAttachmentDto {
  @ApiProperty({ example: '/uploads/1234567890-baocaoTNLD.pdf' })
  @IsNotEmpty()
  @IsString()
  attachment_url: string;

  @ApiProperty({ example: 'baocaoTNLD.pdf' })
  @IsNotEmpty()
  @IsString()
  @Matches(/\.pdf$/i, {
    message:
      'File đính kèm chỉ nhận định dạng PDF. Vui lòng mở file Word mẫu, điền thông tin, xuất ra PDF rồi nộp lại.',
  })
  attachment_name: string;
}
