import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class UserProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty()
  @Matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, {
    message: 'Email phải có đuôi @gmail.com',
  })
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  dateOfBirth: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  gender: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty()
  @IsOptional()
  provinceId?: number | null;

  @ApiProperty()
  @IsOptional()
  districtId?: number | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty()
  @IsOptional()
  avatarUrl?: string | null;
}
