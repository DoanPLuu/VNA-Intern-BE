import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAttachmentDto {
  @ApiProperty({ example: '/uploads/1234567890-baocaoTNLD.pdf' })
  @IsNotEmpty()
  @IsString()
  attachment_url: string;

  @ApiProperty({ example: 'baocaoTNLD.pdf' })
  @IsNotEmpty()
  @IsString()
  attachment_name: string;
}
