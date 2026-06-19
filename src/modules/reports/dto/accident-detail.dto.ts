import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class OccupationalAccidentDto {
  // Phân theo nguyên nhân xảy ra tai nạn lao động
  @ApiProperty({
    example: 'Không có thiết bị an toàn hoặc không đảm bảo an toàn',
  })
  @IsNotEmpty({ message: 'Vui lòng chọn nguyên nhân xảy ra TNLĐ' })
  accident_cause: string;

  // Phân theo yếu tố gây chấn thương
  @ApiProperty({ example: 'Thiết bị nặng' })
  @IsNotEmpty({ message: 'Vui lòng chọn yếu tố gây chấn thương' })
  injury_factor: string;

  // Phân theo nghề nghiệp
  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng chọn nghề nghiệp' })
  profession: string;

  // Tổng số vụ
  @ApiProperty({ example: 2 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_accidents: number;

  // Tổng số vụ có người chết
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_fatal_accidents: number;

  // Tổng số vụ có 2 người chết trở lên
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_accidents_with_two_or_more_victims: number;

  // Tổng số người bị nạn
  @ApiProperty({ example: 10 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_victims: number;

  // Tổng số lao động nữ bị nạn
  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_female_victims: number;

  // Tổng số người bị chết
  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_fatalities: number;

  // Tổng số người bị thương nặng
  @ApiProperty({ example: 10 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_seriously_injured: number;

  // Số người bị nạn không quản lý
  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  unmanaged_victims: number;

  // Số lao động nữ bị nạn không quản lý
  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  unmanaged_female_victims: number;

  // Số người chết không quản lý
  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  unmanaged_fatalities: number;

  // Người bị thương nặng không quản lý
  @ApiProperty({ example: 0 })
  @IsNotEmpty({ message: 'Không được để trống' })
  unmanaged_seriously_injured: number;

  // Chi phí y tế
  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  medical_expenses: number;

  // Chi phí trả lương trong thời gian điều trị
  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  salary_paid_during_treatment: number;

  // Chi phí bồi thường trợ cấp
  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  compensation_expenses: number;

  // Tổng số tiền chi phí
  total_expenses: number; // Không cần nhập

  // Tổng số ngày nghỉ vì tai nạn lao động
  @ApiProperty({ example: 20 })
  @IsNotEmpty({ message: 'Không được để trống' })
  total_leave_days: number;

  // Thiệt hại tài sản
  @ApiProperty({ example: 10000000 })
  @IsNotEmpty({ message: 'Không được để trống' })
  property_damage_expanses: number;
}
