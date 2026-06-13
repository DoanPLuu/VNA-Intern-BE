import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { IsNotFutureDate } from 'src/common/validators/is-not-future-date.decorator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'admin-vna' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  username?: string;

  @ApiPropertyOptional({ example: 'admin@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  roleId?: number;

  @ApiPropertyOptional({ example: '1995-06-01' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng YYYY-MM-DD' })
  @IsNotFutureDate({ message: 'Ngày sinh không được lớn hơn ngày hiện tại' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Nam' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'Chuyen vien' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Thanh pho Ho Chi Minh' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 'Phuong Go Vap' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: '123 Nguyen Trai' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
