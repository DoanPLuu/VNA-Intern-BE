import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class AccidentDetailDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Vui lòng chọn nguyên nhân tai nạn' })
  @IsInt()
  @IsPositive()
  accident_cause_id: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Vui lòng chọn yếu tố gây chấn thương' })
  @IsInt()
  @IsPositive()
  injury_factor_id: number;

  @ApiProperty({ example: 12 })
  @IsNotEmpty({ message: 'Vui lòng chọn nghề nghiệp' })
  @IsInt()
  @IsPositive()
  profession_id: number;

  @ApiProperty({ example: 10 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_victims: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_female_victims: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_fatalities: number;

  @ApiProperty({ example: 10 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_seriously_injured: number;

  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  unmanaged_victims: number;

  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  unmanaged_female_victims: number;

  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  unmanaged_fatalities: number;

  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  unmanaged_seriously_injured: number;

  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsNumber({}, { message: 'Phải là số' })
  @Min(0, { message: 'Không được âm' })
  medical_expenses: number;

  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsNumber({}, { message: 'Phải là số' })
  @Min(0, { message: 'Không được âm' })
  salary_paid_during_treatment: number;

  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsNumber({}, { message: 'Phải là số' })
  @Min(0, { message: 'Không được âm' })
  compensation_expenses: number;

  @ApiProperty({ example: 20 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_leave_days: number;

  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsNumber({}, { message: 'Phải là số' })
  @Min(0, { message: 'Không được âm' })
  property_damage_expenses: number;
}
