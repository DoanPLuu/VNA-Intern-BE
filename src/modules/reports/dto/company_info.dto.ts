import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CompanyInfoDto {
  @ApiProperty({ example: 'Công ty TNHH ABC' })
  @IsString()
  business_name: string;

  @ApiProperty({ example: 'Công ty TNHH một thành viên' })
  @IsOptional()
  @IsString()
  business_type: string | null;

  @ApiProperty({ example: 'Khai thác dầu thô' })
  @IsOptional()
  @IsString()
  business_industry: string | null;

  // Tổng số lao động của cơ sở
  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  total_employees: number;

  // Tổng số lao động nữ
  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  total_female_employees: number;

  // Tổng quỹ lương
  @ApiProperty({ example: 10000000 })
  @IsNotEmpty()
  total_salary_fund: number;
}
