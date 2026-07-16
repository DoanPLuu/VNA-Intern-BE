import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UserProfileDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'admin@gmail.com' })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsOptional()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email không đúng định dạng',
  })
  email: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '1995-06-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({ example: 'Nam' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 'Quản trị viên' })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsString()
  position: string;

  @ApiProperty({ example: 'Tp Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  province?: string;

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
