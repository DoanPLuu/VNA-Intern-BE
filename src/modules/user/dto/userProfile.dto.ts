import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class UserProfileDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'admin@gmail.com' })
  @IsOptional()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email không đúng định dạng',
  })
  email?: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: '1995-06-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({ example: 'Nam' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 'Quản trị viên' })
  @IsOptional()
  @IsString()
  chucdanh?: string;

  @ApiProperty({ example: 'QUAN_TRI' })
  @IsOptional()
  @IsString()
  vaitro?: string;

  // Truyền tên tỉnh (vd: "Tp Hồ Chí Minh") → service tự tìm id
  @ApiProperty({ example: 'Tp Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  province?: string;

  // Truyền tên phường/xã (vd: "Phường Chợ Lớn") → service tự tìm id
  @ApiProperty({ example: 'Phường Chợ Lớn' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ example: '123 Nguyễn Trãi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
