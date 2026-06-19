import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CompanyInfoDto {
  @ApiProperty({ example: 100 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt()
  @IsPositive()
  total_employees: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt()
  @IsPositive()
  total_female_employees: number;

  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsPositive()
  total_salary_fund: number;
}
