import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AccidentStatisticDto {
  @ApiProperty({ example: 2 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_accidents: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_fatal_accidents: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Không được để trống' })
  @IsInt({ message: 'Phải là số nguyên' })
  @Min(0, { message: 'Không được âm' })
  total_accidents_with_two_or_more_victims: number;

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
