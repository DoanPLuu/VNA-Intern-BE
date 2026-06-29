import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CompanyInfoDto {
  @ApiProperty({ example: 100 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt()
  @Min(0, { message: 'Không được âm' })
  total_employees: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt()
  @Min(0, { message: 'Không được âm' })
  total_female_employees: number;

  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @Min(0, { message: 'Không được âm' })
  total_salary_fund: number;
}
